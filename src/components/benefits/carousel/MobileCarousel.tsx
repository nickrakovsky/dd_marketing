import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ImageData } from "./SmartCollage";

interface MobileCarouselProps {
  images: ImageData[];
}

export const MobileCarousel = ({ images }: MobileCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [current]);

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 100 : -100, opacity: 0 }),
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
    <div className="w-full flex flex-col gap-4">
      <div className="relative w-full rounded-xl overflow-hidden">
        
        {/* 1. THE ANCHOR (Invisible)
            This stays in the layout flow (relative) to prop open the container height.
            It matches the current image exactly.

            `width`/`height` are REQUIRED here, not optional hints. This element is
            the only thing giving the container a height, and with `w-full h-auto`
            that height comes from the image's aspect ratio. Without the
            attributes the browser has no ratio until the bytes land, so the
            container starts at 0 tall and snaps open on load — a 0.058 mobile
            layout shift that also dragged the LCP element down the page
            (measured on /benefits/digitize-operations at Slow-4G/6x CPU).
            The values come straight from `ImageData`, which every gallery
            already populates from the Astro-optimized asset.
        */}
        <img
          src={images[current].src}
          alt="Anchor"
          width={images[current].width}
          height={images[current].height}
          className="w-full h-auto opacity-0 pointer-events-none relative z-0"
          aria-hidden="true"
          loading="eager"
        />

        {/* 2. THE ANIMATION LAYER (Absolute)
            Sits directly on top of the anchor (inset-0).
        */}
        <div className="absolute inset-0 z-10">
             <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={current}
                ref={imgRef}
                src={images[current].src}
                alt={images[current].alt}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                loading="eager"       
                fetchPriority="high" 
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
                onLoad={() => setIsLoaded(true)}
                // Absolute positioning to overlap the anchor exactly
                className={`absolute w-full h-full object-contain block transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </AnimatePresence>

            {/* Controls */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                paginate(-1);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-primary hover:bg-white z-20 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                paginate(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-primary hover:bg-white z-20 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="flex justify-center gap-2">
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
                : "bg-primary/20 w-1.5 hover:bg-primary/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};