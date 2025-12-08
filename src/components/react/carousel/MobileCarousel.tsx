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
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
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
    // FIX: A single rounded container.
    // 'pb-12' creates the "whitespace" at the bottom for dots, allowing the image to sit flush at the top.
    <div className="relative w-full rounded-xl overflow-hidden shadow-sm border border-border bg-white pb-12">
      
      {/* 1. The Image Area */}
      {/* 'h-auto' ensures it is never cropped. It grows as tall as it needs to be. */}
      <div className="relative w-full overflow-hidden">
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
              if (Math.abs(offset.x * velocity.x) > 10000) {
                paginate(offset.x > 0 ? -1 : 1);
              }
            }}
            // FIX: 'block' removes ghost whitespace. 'w-full' fits width.
            className="w-full h-auto block"
          />
        </AnimatePresence>

        {/* Nav Arrows (Floating on image) */}
        <button
          onClick={() => paginate(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-primary hover:bg-white z-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => paginate(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-primary hover:bg-white z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 2. The Dots Area (Sits in the pb-12 space) */}
      <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center gap-2">
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
                : "bg-primary/20 w-1.5"
            }`}
          />
        ))}
      </div>
    </div>
  );
};