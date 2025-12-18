import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn } from "lucide-react";
import { MobileCarousel } from "./MobileCarousel"; 
import Lightbox from "./Lightbox";
import type { ImageMetadata } from "astro";

interface CapacityGalleryProps {
  image: ImageMetadata;
  overlayImage?: ImageMetadata;
  mobileImages?: { src: ImageMetadata; alt: string }[];
}

export default function CapacityGallery({ image, overlayImage, mobileImages }: CapacityGalleryProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Prepare images for Lightbox
  const focusableImages = mobileImages ? mobileImages.map((img, i) => ({
    src: img.src.src,
    alt: img.alt || `Detail View ${i}`,
  })) : [{ src: image.src, alt: "Schedule View" }];

  const nextImage = (e: any) => {
    e?.stopPropagation();
    setFocusedIndex((prev) => (prev === focusableImages.length - 1 ? 0 : (prev || 0) + 1));
  };

  const prevImage = (e: any) => {
    e?.stopPropagation();
    setFocusedIndex((prev) => (prev === 0 ? focusableImages.length - 1 : (prev || 0) - 1));
  };

  // Prepare images for MobileCarousel
  const carouselImages = mobileImages ? mobileImages.map((img) => ({
    src: img.src.src,
    alt: img.alt,
    width: img.src.width,
    height: img.src.height
  })) : [];

  return (
    <>
      {/* ---------------------------------------------------------------------------
          MOBILE VIEW: Shared MobileCarousel
          --------------------------------------------------------------------------- */}
      <div className="block md:hidden w-full mt-0">
        <MobileCarousel images={carouselImages.length > 0 ? carouselImages : [{ 
            src: image.src, 
            alt: "Capacity View", 
            width: image.width, 
            height: image.height 
          }]} 
        />
      </div>

      {/* ---------------------------------------------------------------------------
          DESKTOP VIEW: VisibilityGallery-style Layout
          --------------------------------------------------------------------------- */}
      <div className="hidden md:block relative w-full h-full">
        <div className="relative w-full max-w-5xl mx-auto">
          
          {/* 1. Base Image (Schedule View) */}
          <motion.div
             animate={{ opacity: focusedIndex !== null ? 0 : 1 }}
             transition={{ duration: 0.3 }}
          >
            <div className="relative z-10 w-full rounded-lg shadow-xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
              <img
                src={image.src}
                alt="Capacity Schedule View"
                className="w-full h-auto block"
                loading="eager"
              />
            </div>
          </motion.div>

          {/* 2. Overlay Image (Interactive) */}
          <AnimatePresence>
            {overlayImage && focusedIndex === null && (
              <motion.div 
                key="overlay-layer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                // UPDATED: Significantly smaller width and max-width as requested
                className="absolute z-20 bottom-0 right-8 w-[18%] max-w-[200px] cursor-pointer"
                onClick={() => setFocusedIndex(1)} 
              >
                <div className="relative rounded-t-lg overflow-hidden shadow-2xl border-t border-x border-white/20 bg-card transform transition-transform duration-300 hover:scale-[1.05] origin-bottom">
                  <img
                    src={overlayImage.src}
                    alt="Capacity Planning Overlay"
                    className="w-full h-auto block"
                    loading="eager"
                  />
                  
                  {/* Hover Icon Overlay */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center group">
                    <div className="bg-white/90 backdrop-blur rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                      <ZoomIn className="text-primary w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3. LIGHTBOX */}
          <AnimatePresence>
            {focusedIndex !== null && (
              <Lightbox 
                image={focusableImages[focusedIndex]}
                onNext={nextImage}
                onPrev={prevImage}
                onClose={() => setFocusedIndex(null)}
              />
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}