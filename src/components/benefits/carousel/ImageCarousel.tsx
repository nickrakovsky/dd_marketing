import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SmartCollage, type ImageData, type SlideType } from "./SmartCollage";
import { MobileCarousel } from "./MobileCarousel";
import { Lightbox } from "./Lightbox";

export interface SlideConfig {
  type: SlideType;
  images: ImageData[];
}

interface ImageCarouselProps {
  slides: SlideConfig[];
  containerHeight?: number;
  autoPlayInterval?: number;
}

export const ImageCarousel = ({ 
  slides, 
  containerHeight = 450,
  autoPlayInterval = 5000,
}: ImageCarouselProps) => {
  const isMobile = useIsMobile();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Flatten images for mobile view and lightbox
  const allImages = slides.flatMap((slide) => slide.images);

  // Calculate image index offset for current slide
  const getGlobalImageIndex = (slideIndex: number, imageIndex: number) => {
    let offset = 0;
    for (let i = 0; i < slideIndex; i++) {
      offset += slides[i].images.length;
    }
    return offset + imageIndex;
  };

  const handleImageClick = (imageIndex: number) => {
    const globalIndex = getGlobalImageIndex(currentSlide, imageIndex);
    setLightboxIndex(globalIndex);
    setLightboxOpen(true);
  };

  const advanceSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Auto-advance slides
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Don't auto-advance if paused, lightbox open, or mobile
    if (isPaused || lightboxOpen || isMobile) {
      return;
    }

    timerRef.current = setInterval(advanceSlide, autoPlayInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, lightboxOpen, isMobile, autoPlayInterval, advanceSlide]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentSlide((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = slides.length - 1;
      if (next >= slides.length) next = 0;
      return next;
    });
  }, [slides.length]);

  if (isMobile) {
    return (
      <div className="w-full px-4">
        <MobileCarousel images={allImages} />
      </div>
    );
  }

  return (
    <>
      <div 
        className="w-full max-w-6xl mx-auto relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Navigation Buttons - Outside container on wide screens */}
        <button
          onClick={() => paginate(-1)}
          className="absolute -left-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors hidden xl:flex"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => paginate(1)}
          className="absolute -right-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors hidden xl:flex"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="px-8">
          <div 
            className="relative overflow-hidden rounded-2xl"
            style={{ height: containerHeight }}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.3 },
                }}
                className="absolute inset-0"
              >
                <SmartCollage 
                  type={slides[currentSlide].type}
                  images={slides[currentSlide].images} 
                  containerHeight={containerHeight}
                  gap={12}
                  onImageClick={handleImageClick}
                />
              </motion.div>
            </AnimatePresence>

            {/* Inner navigation for narrow screens */}
            <button
              onClick={() => paginate(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-background/90 transition-all xl:hidden"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-background/90 transition-all xl:hidden"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-2 mt-5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentSlide ? 1 : -1);
                  setCurrentSlide(index);
                }}
                className="group relative py-2"
                aria-label={`Go to slide ${index + 1}`}
              >
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${
                    index === currentSlide
                      ? "w-6 bg-accent"
                      : "w-2 bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        images={allImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
};
