# Recoleta web subsets

Layout uses two disjoint Unicode subsets per weight. Core contains ASCII and
common punctuation/symbols; Extended contains the remaining accented Latin
characters and symbols. CSS `unicode-range` fetches Extended only when visible
text needs it. PrintLayout retains the existing full Latin fonts.

| Face | Existing full Latin | Core | Extended (on demand) |
| --- | ---: | ---: | ---: |
| Regular | 25,616 bytes | 18,136 bytes | 9,544 bytes |
| SemiBold | 25,908 bytes | 18,436 bytes | 9,728 bytes |

Pages using only core text download 36,572 bytes instead of 51,524 bytes for
these two weights: 14,952 bytes (29.0%) less. Pages needing both subsets may
download slightly more than the previous single face. All 192 mapped Unicode
characters are retained across each pair; glyph advances, font metrics, and
OpenType layout features are retained. The ranges in Layout must stay in sync
with the generator.

Regenerate manually with `python scripts/subset-recoleta.py` using
`fonttools[woff]==4.60.2`. No font tooling is required in the production build.
Source files are the existing Recoleta-Regular.woff2 and
Recoleta-SemiBold.woff2 in this directory.
