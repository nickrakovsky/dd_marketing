import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { MobileCarousel } from "./MobileCarousel"; 

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
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Filter out just the grid images for the zoomed view
  const focusableImages = gridImages.map((img, i) => ({
    src: img.src,
    alt: `Detail View ${i}`,
    width: img.width,
    height: img.height
  }));

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (focusedIndex === null) return;
    setIsImageLoaded(false);
    setFocusedIndex((prev) => (prev === focusableImages.length - 1 ? 0 : (prev || 0) + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (focusedIndex === null) return;
    setIsImageLoaded(false);
    setFocusedIndex((prev) => (prev === 0 ? focusableImages.length - 1 : (prev || 0) - 1));
  };

  return (
    <>
      {/* --- MOBILE VIEW --- */}
      <div className="block md:hidden w-full mt-0">
        <MobileCarousel images={gridImages.map(img => ({ ...img, alt: 'Gallery Image' }))} />
      </div>

      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:block relative w-full max-w-6xl mx-auto mt-0">
        
        {/* NAVIGATION ARROWS */}
        <AnimatePresence>
          {focusedIndex !== null && (
            <>
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={prevImage}
                // LOGIC: Inside by default, Outside on XL screens
                className="absolute top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 shadow-md text-primary hover:bg-primary hover:text-white transition-all z-50 
                           left-4 xl:-left-16"
              >
                <ChevronLeft size={32} />
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={nextImage}
                className="absolute top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 shadow-md text-primary hover:bg-primary hover:text-white transition-all z-50 
                           right-4 xl:-right-16"
              >
                <ChevronRight size={32} />
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* MAIN CONTAINER */}
        <div className="relative w-full rounded-2xl border border-primary/20 bg-white/50 shadow-custom-lg backdrop-blur-sm overflow-hidden leading-none text-[0px]">
          
          <AnimatePresence mode="popLayout" initial={false}>
            {focusedIndex !== null ? (
              
              // --- FOCUSED VIEW ---
              <motion.div
                key="focused-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full relative min-h-[400px]"
              >
                {/* FIX: The 'opacity-0' class ensures it is hidden by CSS immediately.
                  The 'transition-opacity' handles the fade in once loaded.
                */}
                <motion.img
                  key={focusedIndex}
                  src={focusableImages[focusedIndex].src}
                  className={`w-full h-auto block transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setIsImageLoaded(true)}
                />

                <button 
                  onClick={() => setFocusedIndex(null)}
                  className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white border border-border shadow-sm text-base text-foreground rounded-full font-medium transition-all z-40"
                >
                  <ArrowLeft size={16} className="text-primary" /> Back
                </button>
              </motion.div>

            ) : (

              // --- GRID VIEW ---
              <motion.div
                key="grid-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col"
              >
                {/* Header Slice */}
                <div className="w-full relative">
                  <img src={headerImage.src} className="w-full h-auto block" alt="Dashboard Header" />
                </div>

                {/* Grid Slices */}
                <div className="grid grid-cols-3 gap-0 w-full">
                  {gridImages.map((img, i) => (
                    <div 
                      key={i} 
                      className="relative group cursor-pointer overflow-hidden"
                      onClick={() => {
                        setIsImageLoaded(false);
                        setFocusedIndex(i);
                      }} 
                    >
                      <img 
                          src={img.src} 
                          className="w-full h-auto block transition-all duration-300 group-hover:brightness-110" 
                          alt={`Slice ${i}`}
                      />
                      <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 transition-colors pointer-events-none" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}