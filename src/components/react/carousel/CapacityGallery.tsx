import { useState, useRef, useEffect } from "react";
import type { ImageMetadata } from "astro";
import { cn } from "@/lib/utils"; // Assuming you have a utility for classes, if not standard strings work

interface CapacityGalleryProps {
  image: ImageMetadata;
  overlayImage?: ImageMetadata;
  mobileImages?: { src: ImageMetadata; alt: string }[];
}

export default function CapacityGallery({ image, overlayImage, mobileImages }: CapacityGalleryProps) {
  // --- MOBILE CAROUSEL STATE ---
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll snap updates for dots
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const width = scrollContainerRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }
  };

  return (
    <div className="w-full h-full">
      
      {/* ---------------------------------------------------------------------------
          DESKTOP VIEW: Mimicking VisibilityGallery Z-Axis Layering
          - Relative Container
          - Base Image: Full Width
          - Overlay Image: Absolute, overlapping, substantial size
      --------------------------------------------------------------------------- */}
      <div className="hidden md:block relative w-full h-full">
        <div className="relative w-full h-full flex items-center justify-center p-4">
          
          {/* Layer 1: Base Image (Schedule View) */}
          <div className="relative z-10 w-full h-auto shadow-2xl rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm">
            <img
              src={image.src}
              alt="Capacity Schedule View"
              className="w-full h-auto object-contain rounded-lg"
              loading="eager"
            />
          </div>

          {/* Layer 2: Overlay Image (Capacity Detail) 
              Positioned to overlap the bottom-right significantly, like the Visibility gallery.
          */}
          {overlayImage && (
            <div className="absolute z-20 -bottom-6 -right-6 w-[55%] lg:w-[45%] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
              <div className="rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20">
                <img
                  src={overlayImage.src}
                  alt="Capacity Planning Overlay"
                  className="w-full h-auto object-contain"
                  loading="eager"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------------------
          MOBILE VIEW: Standard Carousel (Swipeable)
          - Shows 'mobileschedule' then 'capacity1'
          - No overlays, just slides.
      --------------------------------------------------------------------------- */}
      <div className="md:hidden relative w-full h-full flex flex-col items-center justify-center">
        
        {/* Scroll Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="w-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0"
        >
          {mobileImages && mobileImages.length > 0 ? (
            mobileImages.map((img, index) => (
              <div key={index} className="min-w-full snap-center p-2 flex items-center justify-center">
                <img
                  src={img.src.src}
                  alt={img.alt}
                  className="w-full h-auto object-contain rounded-lg shadow-md border border-border/40"
                  loading="eager"
                />
              </div>
            ))
          ) : (
            /* Fallback */
            <div className="min-w-full p-2">
              <img src={image.src} alt="Fallback" className="w-full h-auto rounded-lg" />
            </div>
          )}
        </div>

        {/* Carousel Dots */}
        {mobileImages && mobileImages.length > 1 && (
          <div className="flex gap-2 mt-4">
            {mobileImages.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex ? "w-6 bg-primary" : "w-2 bg-primary/20"
                }`}
                onClick={() => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({
                      left: index * scrollContainerRef.current.offsetWidth,
                      behavior: "smooth"
                    });
                  }
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}