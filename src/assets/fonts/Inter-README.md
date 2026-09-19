# Inter

`Inter-Latin-Variable.woff2` is the Latin subset of Inter, normal style, loaded
locally by the homepage, using `font-display: swap`.

Its variable weight axis has been narrowed from the original 100–900 to
400–700 (48,432 -> 34,412 bytes, -29%). That range covers every font-weight
value actually used with Inter on the homepage (400, 500, 600, 650, 700 --
audited via grep across HomePage.astro's styles) with no glyphs dropped:
narrowing regenerated the file with subset-font's `variationAxes` option
using the font's own full existing character set (read via `fontkit`) as the
text input, so glyph coverage is unchanged -- only the weight-interpolation
range shrank. Verified by rendering both the original and narrowed file
side-by-side at all 5 weights in a real browser; output was pixel-identical.
If a future design needs a weight outside 400–700, re-derive from the
original source file below rather than assume this one has headroom.

- Font: Inter by Rasmus Andersson
- Source: https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap
- Font file: https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2
- License: SIL Open Font License 1.1; see `Inter-OFL.txt`
- License source: https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt
- Retrieved: 2026-09-16
