// Single source of truth for the Bento SDK methods this site calls.
// Imported by src/lib/bento.ts to type window.bento. Adding a new method
// here is the only place you need to update.
//
// Previously also forwarded into a Partytown Web Worker (as `bento.<method>`
// strings) so the Bento SDK could run off the main thread. Removed: Bento's
// own loader creates a second dynamic script tag pointing at
// app.bentonow.com/{uuid}.js, and neither that domain nor fast.bentonow.com
// sends CORS headers, so Partytown's fetch-based script loading (required to
// run script content inside its sandboxed worker) failed on every page load,
// confirmed live via Playwright. A normal script tag has no such requirement.
export const BENTO_FORWARDED_METHODS = [
  'identify',
  'track',
  'view',
  'tag',
  'updateFields',
];
