#!/usr/bin/env python3
"""Build a static read-only HTML view of the shipped XLSX. Never edits the workbook."""
from datetime import datetime, timedelta
from html import escape
from pathlib import Path, PurePosixPath
import posixpath
import re
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/files/warehouse-audit-working-pack.xlsx'
OUTPUT = SOURCE.with_name('warehouse-audit-working-pack-preview.html')
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
RID = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'


def col_number(letters):
    result = 0
    for letter in letters:
        result = result * 26 + ord(letter) - 64
    return result


def col_name(number):
    result = ''
    while number:
        number, remainder = divmod(number - 1, 26)
        result = chr(65 + remainder) + result
    return result


def coordinate(ref):
    letters, row = re.fullmatch(r'\$?([A-Z]+)\$?(\d+)', ref).groups()
    return int(row), col_number(letters)


def package_target(part, target):
    if target.startswith('/'):
        return posixpath.normpath(target.lstrip('/'))
    return posixpath.normpath(str(PurePosixPath(part).parent / target))


def relationships(archive, part):
    path = PurePosixPath(part)
    relpath = str(path.parent / '_rels' / (path.name + '.rels'))
    if relpath not in archive.namelist():
        return {}
    return {item.get('Id'): item for item in ET.fromstring(archive.read(relpath))}


def build():
    with ZipFile(SOURCE) as archive:
        workbook = ET.fromstring(archive.read('xl/workbook.xml'))
        book_rels = relationships(archive, 'xl/workbook.xml')
        styles = ET.fromstring(archive.read('xl/styles.xml'))
        xfs = list(styles.find('s:cellXfs', NS))
        fonts = list(styles.find('s:fonts', NS))
        formats = {int(item.get('numFmtId')): item.get('formatCode', '') for item in styles.findall('s:numFmts/s:numFmt', NS)}
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared = [''.join(item.itertext()) for item in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('s:si', NS)]
        sheets = list(workbook.find('s:sheets', NS))
        sheet_ids = {sheet.get('name'): f'sheet-{index}' for index, sheet in enumerate(sheets, 1)}
        book_properties = workbook.find('s:workbookPr', NS)
        date_base = datetime(1904, 1, 1) if book_properties is not None and book_properties.get('date1904') == '1' else datetime(1899, 12, 30)

        def cell_text(cell):
            raw = cell.findtext('s:v', '', NS)
            kind = cell.get('t', '')
            if kind == 's':
                return shared[int(raw)] if raw else ''
            if kind == 'inlineStr':
                return ''.join(cell.find('s:is', NS).itertext())
            if kind == 'b':
                return 'TRUE' if raw == '1' else 'FALSE'
            if raw and kind not in ('str', 'e'):
                number_format = int(xfs[int(cell.get('s', '0'))].get('numFmtId', '0'))
                if number_format in (14, 15, 16, 17, 22) or re.search(r'd.*m.*y', formats.get(number_format, ''), re.I):
                    return (date_base + timedelta(days=float(raw))).strftime('%d %b %Y')
            return raw

        def link_target(target, current_sheet):
            location = target.lstrip('#')
            match = re.fullmatch(r"(?:'((?:[^']|'')+)'|([^!]+))!\$?([A-Z]+)\$?(\d+)", location)
            if match:
                name = (match[1] or match[2]).replace("''", "'")
                return f'#{sheet_ids[name]}-{match[3]}{match[4]}' if name in sheet_ids else None
            if re.fullmatch(r'\$?[A-Z]+\$?\d+', location):
                return f'#{current_sheet}-{location.replace("$", "")}'
            return target if urlsplit(target).scheme in ('https', 'http', 'mailto') else None

        sections = []
        workbook_title = 'Warehouse Audit Working Pack'
        compressed_rows = 0
        for sheet in sheets:
            name = sheet.get('name')
            sheet_id = sheet_ids[name]
            part = package_target('xl/workbook.xml', book_rels[sheet.get(RID)].get('Target'))
            tree = ET.fromstring(archive.read(part))
            rels = relationships(archive, part)
            rows = {int(row.get('r')): row for row in tree.findall('s:sheetData/s:row', NS)}
            cells = {cell.get('r'): cell for row in rows.values() for cell in row.findall('s:c', NS)}
            links = {}
            for link in tree.findall('s:hyperlinks/s:hyperlink', NS):
                relation = rels.get(link.get(RID))
                target = link.get('location') or (relation.get('Target') if relation is not None else '')
                href = link_target(target, sheet_id)
                if href:
                    links[link.get('ref')] = href

            def text_at(ref):
                return cell_text(cells[ref]) if ref in cells else ''

            def content_at(ref):
                text = text_at(ref)
                content = escape(text)
                return f'<a href="{escape(links[ref], quote=True)}">{content}</a>' if ref in links and content else content

            def cell_id(ref):
                return f'{sheet_id}-{ref}'

            def is_heading(ref):
                cell = cells[ref]
                font = fonts[int(xfs[int(cell.get('s', '0'))].get('fontId', '0'))]
                size = font.find('s:sz', NS)
                return size is not None and float(size.get('val', '11')) >= 14

            # Native table ranges provide reliable boundaries between notes and records.
            tables = {}
            table_rows = set()
            for item in tree.findall('s:tableParts/s:tablePart', NS):
                table_part = package_target(part, rels[item.get(RID)].get('Target'))
                table = ET.fromstring(archive.read(table_part))
                start, end = table.get('ref').split(':')
                top, left = coordinate(start)
                bottom, right = coordinate(end)
                tables[top] = (top, left, bottom, right)
                table_rows.update(range(top, bottom + 1))

            def render_table(bounds):
                nonlocal compressed_rows
                top, left, bottom, right = bounds
                columns = list(range(left, right + 1))
                record_rows, templates = [], []
                for row_number in range(top + 1, bottom + 1):
                    populated = [(column, text_at(f'{col_name(column)}{row_number}')) for column in columns if text_at(f'{col_name(column)}{row_number}')]
                    # Blank/ID-only rows are supplied writing templates, not findings.
                    if not populated or (len(populated) == 1 and populated[0][0] == left and re.fullmatch(r'[FA]\d{3}', populated[0][1])):
                        templates.append(row_number)
                    else:
                        record_rows.append(row_number)
                seeded = any(text_at(f'{col_name(left)}{row}') for row in templates)
                shown_templates = templates[:3 if seeded else 1]
                visible_rows = sorted(record_rows + shown_templates)
                compressed_rows += len(templates) - len(shown_templates)
                header = ''.join(f'<th id="{cell_id(f"{col_name(column)}{top}")}" scope="col">{content_at(f"{col_name(column)}{top}")}</th>' for column in columns)
                body = []
                for row_number in visible_rows:
                    body.append('<tr>' + ''.join(f'<td id="{cell_id(f"{col_name(column)}{row_number}")}">{content_at(f"{col_name(column)}{row_number}")}</td>' for column in columns) + '</tr>')
                summary = ''
                if templates:
                    qualifier = 'blank template rows' if seeded else 'blank working rows'
                    summary = f'<p class="template-summary">{len(templates)} {qualifier} in the workbook.'
                    if len(templates) > len(shown_templates):
                        summary += f' {len(shown_templates)} shown here.'
                    summary += '</p>'
                    omitted = set(templates) - set(shown_templates)
                    # Retain source destinations even when repeated template rows collapse.
                    summary += '<span hidden>' + ''.join(f'<span id="{cell_id(f"{col_name(column)}{row}")}"></span>' for row in sorted(omitted) for column in columns) + '</span>'
                wide = ' wide-table' if len(columns) > 4 else ''
                return f'<div class="table-block">{summary}<div class="table-scroll" tabindex="0" role="region" aria-label="{escape(name, quote=True)} records"><table class="{wide.strip()}"><thead><tr>{header}</tr></thead><tbody>{"".join(body)}</tbody></table></div></div>'

            body = []
            title = text_at('A2')
            if name == 'Read me' and title:
                workbook_title = title
            for row_number, row in rows.items():
                if row_number == 2:
                    continue
                if row_number in tables:
                    body.append(render_table(tables[row_number]))
                    continue
                if row_number in table_rows:
                    continue
                populated = [(cell.get('r'), cell_text(cell)) for cell in row.findall('s:c', NS) if cell_text(cell)]
                if not populated:
                    continue
                if len(populated) == 1:
                    ref, _ = populated[0]
                    tag = 'h3' if is_heading(ref) else 'p'
                    body.append(f'<{tag} id="{cell_id(ref)}">{content_at(ref)}</{tag}>')
                else:
                    label_ref = populated[0][0]
                    details = ''.join(f'<span id="{cell_id(ref)}">{content_at(ref)}</span>' for ref, _ in populated[1:])
                    body.append(f'<dl class="field"><dt id="{cell_id(label_ref)}">{content_at(label_ref)}</dt><dd>{details}</dd></dl>')
                # Meeting fields have a label and blank value; preserve them as fields.
                if name == 'Management review' and row_number in (4, 5, 6):
                    body[-1] = f'<dl class="field"><dt id="{cell_id(populated[0][0])}">{content_at(populated[0][0])}</dt><dd class="blank-field"></dd></dl>'
            heading = name if name == 'Read me' else (title or name)
            sections.append(f'<section id="{sheet_id}" data-sheet><h2 tabindex="-1">{escape(heading)}</h2><span id="{cell_id("A2")}"></span>{"".join(body)}</section>')

        navigation = ''.join(f'<a href="#{sheet_ids[sheet.get("name")]}">{escape(sheet.get("name"))}</a>' for sheet in sheets)
        css = '''
*{box-sizing:border-box}body{margin:0;background:#FFF8EE;color:#171411;font:15px/1.5 Arial,sans-serif}a{color:inherit;text-underline-offset:.2em}a:focus-visible,[tabindex]:focus-visible{outline:2px solid #FE5000;outline-offset:3px}.page-header{padding:1.25rem 1.5rem;border-bottom:1px solid #D8C9B8}.publisher{margin:0 0 .25rem;color:#61594F;font-size:.8rem;font-weight:700}h1{margin:0 0 .5rem;font:700 1.6rem/1.25 Georgia,serif}.page-header p:last-child{margin:0}nav{display:flex;flex-wrap:wrap;gap:.5rem;padding:1rem 1.5rem}nav a{padding:.5rem .75rem;border:1px solid #D8C9B8;text-decoration:none}nav a[aria-current]{border-color:#FE5000;background:#FFE6D5}main{padding:0 1.5rem 1.5rem}section{margin:0 0 2rem}section[hidden]{display:none}h2{font:700 1.3rem/1.3 Georgia,serif;margin:.25rem 0 1rem}h3{font:700 1.1rem/1.4 Georgia,serif;color:#FE5000;margin:1.5rem 0 .75rem}section>p{max-width:80ch;margin:.65rem 0;white-space:pre-wrap}.field{display:grid;grid-template-columns:minmax(10rem,1fr) minmax(0,3fr);max-width:90rem;margin:0;padding:.6rem .75rem;background:#fff;border-bottom:1px solid #D8C9B8;gap:1rem}.field dt{font-weight:700}.field dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.field dd span{display:block}.blank-field{min-height:1.5em;background:#FFE6D5}.table-block{margin:1rem 0}.table-scroll{overflow-x:auto;background:#fff;border:1px solid #D8C9B8}table{width:100%;border-collapse:collapse}.wide-table{min-width:70rem}th,td{padding:.65rem .75rem;text-align:left;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere;border-bottom:1px solid #D8C9B8}th{font-size:.875rem;font-weight:700;background:#171411;color:#fff}td:empty{background:#FFE6D5;min-width:6rem}td a{color:inherit}.template-summary{font-size:.875rem;color:#61594F;margin:.5rem 0}@media(max-width:600px){.page-header{padding:1rem}nav{padding:1rem;gap:.4rem}main{padding:0 1rem 1rem}.field{grid-template-columns:1fr;gap:.25rem}th,td{padding:.5rem}}@media print{section[hidden]{display:block}.table-scroll{overflow:visible}nav{display:none}}
'''
        script = '''
const sheets=[...document.querySelectorAll('[data-sheet]')];
function selectSheet(){
  const target=document.getElementById(location.hash.slice(1));
  const selected=target?.closest('[data-sheet]')||sheets[0];
  sheets.forEach(sheet=>{sheet.hidden=sheet!==selected;});
  document.querySelectorAll('nav a').forEach(link=>{
    if(link.hash==='#'+selected.id)link.setAttribute('aria-current','true');
    else link.removeAttribute('aria-current');
  });
  if(target)requestAnimationFrame(()=>{
    if(target===selected)selected.querySelector('h2').focus({preventScroll:true});
    else target.scrollIntoView({block:'nearest',inline:'nearest'});
  });
}
addEventListener('hashchange',selectSheet);selectSheet();
'''
        html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Warehouse audit workbook | DataDocks</title><style>{css}</style></head><body><header class="page-header"><p class="publisher">DataDocks</p><h1>{escape(workbook_title)}</h1><p>Read-only preview. <a href="/files/warehouse-audit-working-pack.xlsx" download>Download the workbook</a> to edit and use its calculations.</p></header><nav aria-label="Worksheets">{navigation}</nav><main>{''.join(sections)}</main><script>{script}</script></body></html>
'''
        assert '\u00b7' not in html, 'Unexpected middle dot'
        assert len(sheets) == 6
        OUTPUT.write_text(html, encoding='utf-8')
        return {'sheets': [sheet.get('name') for sheet in sheets], 'bytes': OUTPUT.stat().st_size, 'compressed_template_rows': compressed_rows}


if __name__ == '__main__':
    print(build())
