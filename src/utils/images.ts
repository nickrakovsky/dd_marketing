import { getImage } from "astro:assets";

export interface CarouselImage {
  src: string;      
  fullSrc: string;  
  alt: string;
  width: number;
  height: number;
}

import type { ImageMetadata } from "astro";

export interface RawSlide {
  images?: { width: number; height: number; [key: string]: unknown }[] | string[] | unknown[];
  [key: string]: unknown;
}

export async function optimizeSlides(rawSlides: RawSlide[]) {
  return await Promise.all(
    rawSlides.map(async (slide) => {
      // If the slide has no images, return it as-is to prevent crashes
      if (!slide.images) return slide;

      const optimizedImages = await Promise.all(
        slide.images.map(async (img: unknown) => {
          const imgRecord = img as Record<string, unknown>;
          const imgWidth = typeof imgRecord.width === 'number' ? imgRecord.width : 800;
          const imgHeight = typeof imgRecord.height === 'number' ? imgRecord.height : 600;
          // Generate Thumbnail (800px WebP)
          const thumb = await getImage({ src: img as string | ImageMetadata, width: 800, format: 'webp' });
          // Generate Lightbox Version (Full resolution WebP)
          const full = await getImage({ src: img as string | ImageMetadata, format: 'webp' }); 
          
          return {
            src: thumb.src,
            fullSrc: full.src,
            alt: "App Screenshot",
            width: imgWidth,
            height: imgHeight
          };
        })
      );

      return {
        ...slide,
        images: optimizedImages
      };
    })
  );
}