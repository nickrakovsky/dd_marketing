#!/usr/bin/python3
"""Offline, backed-up repair of the verified Joey -> work home-folder move.

Default is read-only. Does not rewrite conversation logs or their byte offsets.
"""
import argparse
import collections
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from datetime import datetime

OLD = '/Users/joeybowie'
NEW = '/Users/work'
ROOT = Path(NEW) / '.codex'
DB = ROOT / 'state_5.sqlite'
GLOBAL = ROOT / '.codex-global-state.json'
PROJECT = Path(NEW) / 'Work/dd_marketing'
WORKTREE = ROOT / 'worktrees/09ea/dd_marketing'
LINKS = (WORKTREE / '.git', PROJECT / '.git/worktrees/dd_marketing/gitdir')


def remap(value):
    if isinstance(value, str) and (value == OLD or value.startswith(OLD + '/')):
        return NEW + value[len(OLD):]
    return value


def path_tree(value):
    if isinstance(value, dict):
        return {k: path_tree(v) for k, v in value.items()}
    if isinstance(value, list):
        return [path_tree(v) for v in value]
    return remap(value)


def connect(path, writable=False):
    conn = sqlite3.connect(path.as_uri() + ('?mode=rw' if writable else '?mode=ro'),
                           uri=True, timeout=5)
    conn.row_factory = sqlite3.Row
    return conn


def integrity(conn):
    result = [r[0] for r in conn.execute('PRAGMA integrity_check')]
    if result != ['ok']:
        raise RuntimeError('Database integrity check failed: ' + str(result))


def ensure_closed():
    result = subprocess.run(['/bin/ps', '-axo', 'pid=,comm='], text=True,
                            capture_output=True, check=True)
    found = []
    for line in result.stdout.splitlines():
        parts = line.strip().split(None, 1)
        if len(parts) != 2:
            continue
        pid, command = parts
        lower = command.lower()
        # Ignore crash reporters, which can outlive the application.
        if 'crashpad' in lower:
            continue
        if (('/chatgpt.app/' in lower or '/codex.app/' in lower)
                or Path(command).name.lower() in ('codex', 'chatgpt')):
            found.append(pid + ' ' + command)
    if found:
        raise RuntimeError('Quit ChatGPT/Codex completely and close any Codex CLI '
                           'sessions, then run this again. Still running:\n' + '\n'.join(found))


def require_directory(path):
    if not Path(path).is_dir():
        raise RuntimeError('Replacement folder is missing: ' + path)


def verify_rollout(path, expected_id):
    path = Path(path)
    if not path.is_file() or path.stat().st_size == 0:
        raise RuntimeError('Replacement chat file is missing or empty: ' + str(path))
    with path.open() as handle:
        first = json.loads(handle.readline())
    if first.get('type') != 'session_meta' or first.get('payload', {}).get('id') != expected_id:
        raise RuntimeError('Replacement chat file has an unexpected session ID: ' + str(path))


def file_change(path, new_bytes):
    if path.is_symlink():
        raise RuntimeError('Refusing to replace a symbolic link: ' + str(path))
    old_bytes = path.read_bytes()
    if old_bytes == new_bytes:
        return None
    return {'path': path, 'before': old_bytes, 'after': new_bytes}


def plan():
    edits, files = [], []
    counts = collections.Counter()
    with connect(DB) as conn:
        integrity(conn)
        rows = conn.execute('SELECT id,rollout_path,cwd,sandbox_policy FROM threads').fetchall()
        for row in rows:
            for field in ('rollout_path', 'cwd', 'sandbox_policy'):
                old = row[field]
                if field == 'sandbox_policy':
                    obj = json.loads(old)
                    changed = path_tree(obj)
                    new = json.dumps(changed, separators=(',', ':')) if changed != obj else old
                else:
                    new = remap(old)
                if new == old:
                    continue
                if field == 'rollout_path':
                    verify_rollout(new, row['id'])
                elif field == 'cwd':
                    require_directory(new)
                edits.append(('threads', {'id': row['id']}, field, old, new))
                counts['chat ' + field] += 1
        for row in conn.execute('SELECT project_id,position,path FROM project_roots'):
            new = remap(row['path'])
            if new != row['path']:
                require_directory(new)
                edits.append(('project_roots', {'project_id': row['project_id'],
                              'position': row['position']}, 'path', row['path'], new))
                counts['project folders'] += 1

    original = GLOBAL.read_bytes()
    state = json.loads(original)
    for value in state.get('local-projects', {}).values():
        roots = value.get('rootPaths', [])
        updated = [remap(p) for p in roots]
        for before, after in zip(roots, updated):
            if before != after:
                require_directory(after)
                counts['app project folders'] += 1
        if updated != roots:
            value['rootPaths'] = updated
    for key in ('thread-projectless-output-directories', 'thread-workspace-root-hints',
                'thread-writable-roots'):
        if key in state:
            updated = path_tree(state[key])
            if updated != state[key]:
                counts['app folder/permission groups'] += 1
                state[key] = updated
    permissions = state.get('electron-persisted-atom-state', {}).get(
        'heartbeat-thread-permissions-by-id', {})
    for value in permissions.values():
        if 'sandboxPolicy' in value:
            updated = path_tree(value['sandboxPolicy'])
            if updated != value['sandboxPolicy']:
                counts['saved follow-up permissions'] += 1
                value['sandboxPolicy'] = updated
    if state != json.loads(original):
        files.append({'path': GLOBAL, 'before': original,
                      'after': (json.dumps(state, ensure_ascii=False, separators=(',', ':')) + '\n').encode()})

    # These two files are the verified reciprocal links for this existing worktree.
    expected = ('gitdir: ' + str(PROJECT / '.git/worktrees/dd_marketing'),
                str(WORKTREE / '.git'))
    for path, target in zip(LINKS, expected):
        old = path.read_text().strip()
        mapped = ('gitdir: ' + remap(old[8:])) if old.startswith('gitdir: ') else remap(old)
        if mapped != target:
            raise RuntimeError('Unexpected worktree link; stopping for review: ' + str(path))
        destination = mapped[8:] if mapped.startswith('gitdir: ') else mapped
        if not Path(destination).exists():
            raise RuntimeError('Worktree link destination is missing: ' + destination)
        if mapped != old:
            change = file_change(path, (mapped + '\n').encode())
            files.append(change)
            counts['Git worktree links'] += 1
    return edits, files, counts


def show_plan(counts):
    if not counts:
        print('No remaining changes in the targeted repair scope.')
    for label, count in sorted(counts.items()):
        print(f'{label}: {count}')


def atomic_write(path, data):
    fd, name = tempfile.mkstemp(prefix='.' + path.name + '.repair-', dir=path.parent)
    try:
        mode = path.stat().st_mode & 0o777
        with os.fdopen(fd, 'wb') as handle:
            os.fchmod(handle.fileno(), mode)
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def backup(files):
    directory = ROOT / 'path-repair-backups' / datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    directory.mkdir(parents=True, mode=0o700)
    manifest = {'database': str(DB), 'files': []}
    with connect(DB) as source, sqlite3.connect(directory / 'state.sqlite') as dest:
        source.backup(dest)
        integrity(dest)
    os.chmod(directory / 'state.sqlite', 0o600)
    for index, change in enumerate(files):
        name = f'file-{index}.backup'
        saved = directory / name
        saved.write_bytes(change['before'])
        saved.chmod(0o600)
        manifest['files'].append({'path': str(change['path']), 'backup': name,
                                  'sha256': hashlib.sha256(change['before']).hexdigest()})
    (directory / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print('Backup: ' + str(directory), flush=True)
    return directory


def restore(directory):
    manifest = json.loads((directory / 'manifest.json').read_text())
    if manifest['database'] != str(DB):
        raise RuntimeError('Backup is for a different Codex database.')
    allowed = {str(GLOBAL), *(str(p) for p in LINKS)}
    originals = []
    for item in manifest['files']:
        if item['path'] not in allowed or Path(item['backup']).name != item['backup']:
            raise RuntimeError('Unexpected backup manifest path.')
        data = (directory / item['backup']).read_bytes()
        if hashlib.sha256(data).hexdigest() != item['sha256']:
            raise RuntimeError('Backup checksum mismatch.')
        originals.append((Path(item['path']), data))
    with connect(directory / 'state.sqlite') as source:
        integrity(source)
        with connect(DB, writable=True) as dest:
            source.backup(dest)
            integrity(dest)
    for path, data in originals:
        atomic_write(path, data)


def apply():
    ensure_closed()
    edits, files, counts = plan()
    show_plan(counts)
    if not counts:
        return
    directory = backup(files)
    ensure_closed()
    conn = connect(DB, writable=True)
    try:
        conn.execute('BEGIN IMMEDIATE')
        for table, identity, field, before, after in edits:
            where = ' AND '.join(k + '=?' for k in identity)
            params = [after, *identity.values(), before]
            result = conn.execute(f'UPDATE {table} SET {field}=? WHERE {where} AND {field}=?', params)
            if result.rowcount != 1:
                raise RuntimeError('A chat/project record changed during repair; stopping.')
        for change in files:
            if change['path'].read_bytes() != change['before']:
                raise RuntimeError('A settings/link file changed during repair; stopping.')
        for change in files:
            atomic_write(change['path'], change['after'])
        integrity(conn)
        conn.commit()
    except BaseException:
        conn.rollback()
        for change in files:
            atomic_write(change['path'], change['before'])
        raise
    finally:
        conn.close()
    try:
        pending, pending_files, _ = plan()
        if pending or pending_files:
            raise RuntimeError('Post-repair verification found remaining targeted changes.')
    except BaseException:
        restore(directory)
        raise
    (directory / 'SUCCESS.txt').write_text('Repair applied and targeted path checks passed.\n')
    print('Repair applied; targeted path checks passed. Reopen ChatGPT and retry the affected chat.')
    print('Undo, with ChatGPT closed:')
    print(f'/usr/bin/python3 "{Path(__file__).resolve()}" --restore "{directory}"')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--apply', action='store_true')
    group.add_argument('--check', action='store_true')
    group.add_argument('--restore', type=Path)
    args = parser.parse_args()
    os.umask(0o077)
    if args.apply:
        apply()
    elif args.restore:
        ensure_closed()
        restore(args.restore.resolve())
        print('Backup restored. Reopen ChatGPT.')
    else:
        _, _, counts = plan()
        show_plan(counts)
        print('Read-only check complete. No changes made.')


if __name__ == '__main__':
    try:
        main()
    except (Exception, KeyboardInterrupt) as error:
        print('STOPPED: ' + str(error), file=sys.stderr)
        sys.exit(1)
