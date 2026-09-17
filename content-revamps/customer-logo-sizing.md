# Homepage customer logo sizing

The prototype targets 1,250 square CSS pixels of visible artwork per logo. This increases every logo's linear dimensions by 14.7% from the previous 950-pixel target. SVG artwork, colour and aspect ratios remain unchanged.

Each slot now follows the artwork's trimmed visible width, with 40 pixels of padding on either side: adjacent logos have an 80-pixel visible edge gap. At viewport widths of 600 pixels or less, padding reduces to 28 pixels and the gap becomes 56 pixels. The 88-pixel row comfortably contains the larger emblems. This replaces equal 240-pixel cells, which gave compact emblems much larger surrounding gaps than wide wordmarks.

Vertical alignment uses the artwork's alpha-weighted centre, excluding transparent padding and white cutouts. There is no horizontal optical offset: such offsets would make the carefully equalised edge gaps uneven again. Variable slot widths are intentional; the regular spacing comes from the visible artwork edges, not the centres of differently proportioned logos. All five repeated groups have identical dimensions, so the existing measured-width marquee continues to wrap cleanly.

Visible ink as a fraction of each logo's own bounding box is intrinsic to the artwork (approximately 14–55% here). Making that fraction identical would require altering the logos. The normalisation equalises **visible ink area**, rather than intrinsic pixel density or coverage of differently sized slots.

The trust label uses Inter at 13 pixels, weight 600 and .09em tracking, in the same uppercase family as the page's preheaders. It retains the colon and a 12-pixel margin to the logo row. Muted introductory words and black emphasis keep the label subordinate to the customer artwork. The original homepage's default component variant is unchanged.

## Raster verification

Measured at four times CSS resolution using the original SVGs resized to their rendered canvas dimensions, then converted back to square CSS pixels. Visible widths and heights exclude source padding:

| Logo | Visible width × height | Visible ink area |
| --- | ---: | ---: |
| LG | 79.34 × 34.94 | 1,252.04 |
| ShipMonk | 139.07 × 25.23 | 1,248.96 |
| GSK | 93.61 × 28.20 | 1,249.50 |
| HelloFresh | 83.88 × 27.30 | 1,247.21 |
| Stitch Fix | 196.33 × 23.82 | 1,246.80 |
| Pepsi | 50.80 × 50.80 | 1,245.68 |
| Samsung | 123.35 × 18.88 | 1,257.48 |
| Toyota | 77.14 × 55.70 | 1,251.30 |
| Columbia | 246.18 × 36.75 | 1,255.20 |

Rasterisation introduces a small variation: approximately 0.95% between the largest and smallest measured areas. Raster edge positions are within 0.13 CSS pixels of the planned 80/56-pixel gaps, including the repeated-group boundary. Exact physical-pixel equality also varies with browser scale and antialiasing. Equal measured mass does not guarantee identical perceived prominence; this is the geometric baseline for reviewing the row, not a claim of browser pixel-perfect equivalence.

Source measurements and centres are reproducible through `scripts/measure-customer-logos.mjs` and stored in `src/data/customer-logo-metrics.json`.
