"""Regenerate Recoleta's on-demand Unicode subsets.

Requires fonttools[woff]==4.60.2. Run manually; generated WOFF2 files are committed.
The existing full Latin faces remain the source and are used by PrintLayout.
"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

FONT_DIR = Path(__file__).resolve().parents[1] / "src/assets/fonts"
CORE = set(range(0x20, 0x7F)) | set(range(0x2000, 0x2070)) | {
    0xA0, 0xA9, 0xAE, 0xB0, 0xB7, 0xD7, 0xF7, 0x2248,
}

for weight in ("Regular", "SemiBold"):
    source_path = FONT_DIR / f"Recoleta-{weight}.woff2"
    with TTFont(source_path, recalcTimestamp=False) as source:
        original_map = source.getBestCmap()
        original_characters = set(original_map)
        coverage = set()
        for label, characters in (
            ("Core", original_characters & CORE),
            ("Extended", original_characters - CORE),
        ):
            with TTFont(source_path, recalcTimestamp=False) as font:
                options = subset.Options()
                options.flavor = "woff2"
                options.layout_features = ["*"]
                options.notdef_outline = True
                subsetter = subset.Subsetter(options=options)
                subsetter.populate(unicodes=characters)
                subsetter.subset(font)
                target = FONT_DIR / f"Recoleta-{weight}-{label}.woff2"
                font.save(target)
            with TTFont(target, recalcTimestamp=False) as result:
                result_map = result.getBestCmap()
                assert set(result_map) == characters
                coverage.update(result_map)
                for codepoint, glyph in result_map.items():
                    assert result['hmtx'][glyph] == source['hmtx'][original_map[codepoint]]
                for table, fields in (
                    ('head', ('unitsPerEm',)),
                    ('hhea', ('ascent', 'descent', 'lineGap')),
                    ('OS/2', ('sTypoAscender', 'sTypoDescender', 'sTypoLineGap')),
                ):
                    for field in fields:
                        assert getattr(result[table], field) == getattr(source[table], field)
            print(f"{target.name}: {target.stat().st_size:,} bytes")
        assert coverage == original_characters
