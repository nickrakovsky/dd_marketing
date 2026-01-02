import { useState, useEffect, lazy, Suspense } from "react"; // Added hooks
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn } from "lucide-react";
import { MobileCarousel } from "./MobileCarousel";
const Lightbox = lazy(() => import("./Lightbox").then(module => ({ default: module.Lightbox })));

interface AstroInputImage {
  src: string;
  width: number;
  height: number;
  format: string;
}

interface VisibilityGalleryProps {
  baseImage: AstroInputImage;
  overlayImage: AstroInputImage;
  galleryImages: AstroInputImage[];
}

export default function VisibilityGallery({ baseImage, overlayImage, galleryImages }: VisibilityGalleryProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

// 2. THE "COMPROMISE-LOAD" TRICK
  // We wait for the component to mount (FCP is done), then trigger the import
  // in the background so it's ready BEFORE the user clicks.
  useEffect(() => {
    const prefetchLightbox = async () => {
      try {
        await import("./Lightbox");
      } catch (e) {
        console.error("Failed to prefetch Lightbox", e);
      }
    };

    // Wait 2.5s (after initial load) then fetch
    const timer = setTimeout(prefetchLightbox, 2500);
    return () => clearTimeout(timer);
  }, []);

  const focusableImages = galleryImages.map((img, i) => ({
    src: img.src,
    alt: `Detail View ${i}`,
  }));

  return (
    <>
      {/* MOBILE VIEW */}
      <div className="block md:hidden w-full mt-0">
        <MobileCarousel 
          images={[...galleryImages, baseImage].map((img, i) => ({ 
            src: img.src, 
            alt: i === galleryImages.length ? 'Property View' : `App Screen ${i}`,
            width: img.width,
            height: img.height 
          }))} 
        />
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:block relative w-full h-full">
        <div className="relative w-full max-w-2xl mx-auto">
          
          {/* Main images load immediately (Eager) */}
          <motion.img 
            src={baseImage.src} 
            alt="Property Overview" 
            className="w-full h-auto block rounded-lg shadow-xl"
            animate={{ opacity: focusedIndex !== null ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            loading="eager"
            fetchPriority="high"
          />

          <AnimatePresence>
            {focusedIndex === null && (
              <motion.div 
                key="overlay-layer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 right-8 w-[28%] max-w-[280px] cursor-pointer z-20"
                onClick={() => setFocusedIndex(0)} 
              >
                <div className="relative rounded-t-xl overflow-hidden shadow-2xl transition-transform duration-200 group hover:scale-[1.02] origin-bottom">
                  <img src={overlayImage.src} alt="Mobile App View" className="w-full h-auto block" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                      <ZoomIn className="text-primary w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lightbox loads lazily but is likely pre-fetched by the time this renders */}
          {focusedIndex !== null && (
            <Suspense fallback={null}>
              <Lightbox 
                images={focusableImages}
                currentIndex={focusedIndex || 0}
                isOpen={focusedIndex !== null}
                onClose={() => setFocusedIndex(null)}
                onNavigate={setFocusedIndex}
              />
            </Suspense>
          )}

        </div>
      </div>
    </>
  );
}