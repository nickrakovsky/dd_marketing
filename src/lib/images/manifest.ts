// Replaced in the private Worker bundle after Astro has generated every image.
// A build that cannot replace this marker fails instead of shipping originals.
export const optimizedImages = '__DD_SSR_IMAGE_MANIFEST__' as unknown as Record<string, string>;
