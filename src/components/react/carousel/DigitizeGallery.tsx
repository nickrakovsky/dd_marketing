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

  const focusableImages = gridImages.map((img, i) => ({
    src: img.src,
    alt: `Detail View ${i}`,
    width: img.width,
    height: img.height
  }));

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (focusedIndex === null) return;
    setFocusedIndex((prev) => (prev === focusableImages.length - 1 ? 0 : (prev || 0) + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (focusedIndex === null) return;
    setFocusedIndex((prev) => (prev === 0 ? focusableImages.length - 1 : (prev || 0) - 1));
  };

  // Shared animation variants to ensure 'hidden' state is robust
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <>
      {/* --- MOBILE VIEW (< md) --- */}
      {/* FIX 1: Removed mt-8 to kill top whitespace */}
      <div className="block md:hidden w-full mt-0">
        <MobileCarousel images={gridImages.map(img => ({ ...img, alt: 'Gallery Image' }))} />
      </div>


      {/* --- DESKTOP VIEW (md+) --- */}
      <div className="hidden md:block relative w-full max-w-6xl mx-auto mt-0">
        
        {/* Navigation Arrows */}
        <AnimatePresence>
          {focusedIndex !== null && (
            <>
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={prevImage}
                // FIX 2: Responsive positioning
                // md/lg: Inside (left-4) | xl: Outside (-left-16)
                className="absolute top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-primary hover:text-white text-primary transition-all z-30 
                           left-4 xl:-left-16"
              >
                <ChevronLeft size={32} />
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={nextImage}
                // FIX 2: Responsive positioning
                // md/lg: Inside (right-4) | xl: Outside (-right-16)
                className="absolute top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-primary hover:text-white text-primary transition-all z-30 
                           right-4 xl:-right-16"
              >
                <ChevronRight size={32} />
              </motion.button>
            </>
          )}
        </AnimatePresence>


        {/* Main Content Box */}
        <div className="relative w-full rounded-2xl border border-primary/20 bg-white/50 shadow-custom-lg backdrop-blur-sm overflow-hidden leading-none text-[0px]">
          
          <AnimatePresence mode="popLayout">
            
            {focusedIndex !== null ? (
              
              // --- FOCUSED VIEW ---
              <motion.div
                key="focused-view"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full relative"
                // FIX 3: Force CSS opacity:0 to prevent "Flash of Unstyled Content" before JS loads
                style={{ opacity: 0 }} 
              >
                <motion.img
                  key={focusedIndex}
                  src={focusableImages[focusedIndex].src}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-auto block"
                />

                <button 
                  onClick={() => setFocusedIndex(null)}
                  className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white border border-border shadow-sm text-base text-foreground rounded-full font-medium transition-all z-20"
                >
                  <ArrowLeft size={16} className="text-primary" /> Back
                </button>
              </motion.div>

            ) : (

              // --- GRID VIEW ---
              <motion.div
                key="grid-view"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col"
                // FIX 3: Force CSS opacity:0
                style={{ opacity: 0 }}
              >
                <div className="w-full relative">
                  <img 
                    src={headerImage.src} 
                    className="w-full h-auto block" 
                    alt="Dashboard Header"
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