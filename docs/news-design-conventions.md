# News design conventions

These conventions apply the DataDocks brand to the news hub and story pages, incorporating the September 2026 design review. They are a starting point for consistent use elsewhere on the site.

## Typography

- **Inter** is the default for summaries, dates, source names, metadata, link labels, controls, and other supporting copy. Use at least 14px for labels and controls, and 16px for summaries.
- **Recoleta** is for subheadings, emphatic introductory statements, and comfortable longform reading. A card summary is supporting copy, so it uses Inter.
- **Bruta** is for large display headlines, in uppercase.
- Write labels in sentence case at normal tracking. Separate categories, dates, and sources with spacing and layout; avoid tiny uppercase microlabels and slash separators.

## Link icons

Use `src/components/LinkIcon.astro`. All variants share a 24px viewBox, 2px rounded strokes, and the surrounding text color. The default rendered size is 20px; `size` and `class` are optional props.

| `kind` | Shape | Meaning |
| --- | --- | --- |
| `internal` (default) | Right chevron | Continue to a DataDocks page |
| `back` | Left chevron | Return to a collection or previous page |
| `down` | Down chevron | Jump to content below |
| `external` | Open frame with an outward chevron | Visit another website |
| `email` | Envelope | Open an email message |

The chevrons match the navigation's existing rounded stroke geometry. The external icon adds an open boundary around the same visual language so that its meaning differs from internal navigation. Avoid arrow shafts, Unicode arrows, and decorative circular icon containers.

Always pair external icons with a visible destination label, such as **Read on CNBC** or **Visit Komi Studio**. An icon alone must not carry that distinction. Use the envelope for email links instead of treating email as another website. Icons are decorative (`aria-hidden` and `focusable="false"`); meaningful visible link text supplies the accessible name. External links may stay in the same tab. If a link opens a new tab, disclose that separately.

```astro
<a href="/news/example">Read the update <LinkIcon /></a>
<a href="https://www.cnbc.com/example">Read on CNBC <LinkIcon kind="external" /></a>
<a href="mailto:info@datadocks.com">Email our team <LinkIcon kind="email" /></a>
```

## Card interactions

- Artwork, headlines and action labels are separate native links to the same destination. Body copy, categories, sources and dates remain normal, selectable text.
- Hovering or keyboard-focusing any one link gives the linked parts a shared, mild response: a fine headline underline, a slightly darker artwork, and an accented action label with a small chevron movement.
- Trigger the shared state with `:has(a:hover, a:focus-visible)`, not by hovering the whole card. Body-text hover and selection must not activate the links.
- Keep a visible focus outline on the focused link, meaningful accessible names for artwork/action links, and reduced-motion support. Do not use click handlers or invisible link overlays on the card wrapper.

## Color and decoration

- Use white text on official orange, with black on the light paper backgrounds.
- Let award names, categories, years, and typography distinguish recognition cards. Do not repeat unrelated graph icons, decorative status dots, or generic line art.
- Use illustration or iconography when it explains the content or an action. Do not add visual marks simply to fill space.
- Keep the shared demo CTA before the footer and preserve the email-first demo flow.
