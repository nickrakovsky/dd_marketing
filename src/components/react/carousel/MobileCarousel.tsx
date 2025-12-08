import { useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ImageData } from "./SmartCollage";

interface MobileCarouselProps {
  images: ImageData[];
}

export const MobileCarousel = ({ images }: MobileCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrent((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = images.length - 1;
      if (next >= images.length) next = 0;
      return next;
    });
  };

  if (!images || images.length === 0) return null;

  return (
    // FIX 1: Removed bg-secondary/20 (made transparent) to prevent "container in container" look
    // FIX 2: aspect-video + object-contain ensures the WHOLE image is seen without cropping
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-transparent shadow-sm border border-border">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.img
          key={current}
          src={images[current].src}
          alt={images[current].alt}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(_, { offset, velocity }: PanInfo) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          // FIX 3: object-contain ensures no edges are cut off
          className="absolute inset-0 w-full h-full object-contain"
        />
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={() => paginate(-1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors border border-border z-10"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => paginate(1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors border border-border z-10"
        aria-label="Next image"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > current ? 1 : -1);
              setCurrent(index);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === current
                ? "bg-primary w-6"
                : "bg-black/20 w-1.5 hover:bg-black/40" // Darker dots for better contrast on transparent bg
            }`}
          />
        ))}
      </div>
    </div>
  );
};