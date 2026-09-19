// Single source of truth for Bento SDK methods that must be forwarded
// from the main thread into the Partytown Web Worker. Imported by
// astro.config.mjs (Partytown config) and src/lib/bento.ts (typed wrapper).
// Adding a new method here is the only place you need to update.
export const BENTO_FORWARDED_METHODS = [
  'identify',
  'track',
  'view',
  'tag',
  'updateFields',
];

export const BENTO_PARTYTOWN_FORWARD = BENTO_FORWARDED_METHODS.map(
  (m) => `bento.${m}`
);
