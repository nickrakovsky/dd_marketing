"""Generate standalone WOFF2 subsets for the comparison page's initial text.

Run manually with fonttools[woff]==4.60.2; generated assets are committed.
The source copy is shared with the page so changed text must regenerate its
subsets. No font tooling is needed by the production build.
"""
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "src/assets/fonts"
HERO = json.loads((ROOT / "src/data/comparison-hero.json").read_text())
FACES = (
    (
        "BrutaGlbCompressed-ExtraBold.woff2",
        "Comparison-Bruta-Hero.woff2",
        " ".join(HERO["heading"]).upper(),
    ),
    (
        "Recoleta-Regular-Core.woff2",
        "Comparison-Recoleta-Hero.woff2",
        HERO["intro"],
    ),
)
METRICS = (
    ("head", ("unitsPerEm",)),
    ("hhea", ("ascent", "descent", "lineGap")),
    (
        "OS/2",
        (
            "sTypoAscender", "sTypoDescender", "sTypoLineGap",
            "usWinAscent", "usWinDescent", "sCapHeight", "sxHeight",
        ),
    ),
)


for source_name, output_name, text in FACES:
    source_path = FONT_DIR / source_name
    output_path = FONT_DIR / output_name
    characters = set(map(ord, text))
    with TTFont(source_path, recalcTimestamp=False) as source:
        source_map = source.getBestCmap()
        missing = characters - source_map.keys()
        if missing:
            raise ValueError(f"{source_name} is missing code points: {sorted(missing)}")

        with TTFont(source_path, recalcTimestamp=False) as font:
            options = subset.Options()
            options.flavor = "woff2"
            options.layout_features = ["*"]
            options.legacy_kern = True
            options.notdef_outline = True
            subsetter = subset.Subsetter(options=options)
            subsetter.populate(unicodes=characters)
            subsetter.subset(font)
            font.save(output_path)

        with TTFont(output_path, recalcTimestamp=False) as result:
            result_map = result.getBestCmap()
            assert set(result_map) == characters, f"{output_name}: changed character coverage"
            for codepoint, glyph in result_map.items():
                assert result["hmtx"][glyph] == source["hmtx"][source_map[codepoint]], (
                    output_name, codepoint, "changed glyph advance or bearing",
                )
            for table, fields in METRICS:
                for field in fields:
                    if hasattr(source[table], field):
                        assert getattr(result[table], field) == getattr(source[table], field), (
                            output_name, table, field,
                        )

    print(f"{output_name}: {output_path.stat().st_size:,} bytes; {len(characters)} code points; metrics unchanged")
