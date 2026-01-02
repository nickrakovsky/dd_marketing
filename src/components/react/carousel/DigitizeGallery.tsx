import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { MobileCarousel } from "./MobileCarousel"; 

// 1. Lazy load
const Lightbox = lazy(() => import("./Lightbox").then(module => ({ default: module.Lightbox })));

interface AstroInputImage {
  src: string;
  width: number;
  height: number;
  format: string;
}

interface DigitizeGalleryProps {
  headerImage: AstroInputImage;
  gridImages: AstroInputImage[];
}

export default function DigitizeGallery({ headerImage, gridImages }: DigitizeGalleryProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // 2. Prefetch
  useEffect(() => {
    const prefetchLightbox = async () => {
      try {
        await import("./Lightbox");
      } catch (e) {
        console.error("Failed to prefetch Lightbox", e);
      }
    };
    const timer = setTimeout(prefetchLightbox, 2500);
    return () => clearTimeout(timer);
  }, []);

  const focusableImages = gridImages.map((img, i) => ({
    src: img.src,
    alt: `Detail View ${i}`,
  }));

  return (
    <>
      <div className="block md:hidden w-full mt-0">
        <MobileCarousel images={gridImages.map((img, i) => ({ 
          src: img.src, 
          alt: `Digitize Screenshot ${i}`,
          width: img.width,
          height: img.height
        }))} />
      </div>

      <div className="hidden md:block relative w-full max-w-6xl mx-auto mt-0">
        <div className="relative w-full rounded-2xl border border-primary/20 bg-white shadow-custom-lg overflow-hidden leading-none text-[0px]">
          
          {/* 1. GRID VIEW */}
          <motion.div
            animate={{ opacity: focusedIndex !== null ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col"
          >
            <div className="w-full relative">
              <img 
                src={headerImage.src} 
                alt="Dashboard Header" 
                className="w-full h-auto block" 
                loading="eager"
                fetchPriority="high"
              />
            </div>

            <div className="grid grid-cols-3 gap-0 w-full">
              {gridImages.map((img, i) => (
                <div 
                  key={i} 
                  className="relative group cursor-pointer overflow-hidden"
                  onClick={() => setFocusedIndex(i)} 
                >
                  <img 
                    src={img.src} 
                    alt={`Slice ${i}`}
                    className="w-full h-auto block transition-transform duration-300 group-hover:brightness-110"
                    loading="eager"
                  />
                  <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 transition-colors pointer-events-none" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* 2. LIGHTBOX (Lazy + Suspense) */}
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