import React, { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useIsMobile } from '../../hooks/use-mobile';
import { cn } from '../../lib/utils';
import type { TestimonialItem } from '../../data/types';

interface TestimonialsProps {
  items: TestimonialItem[];
}

const getInitials = (name: string) => {
  return name
    .split(',')[0]
    .trim()
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function Testimonials({ items }: TestimonialsProps) {
  const isMobile = useIsMobile();
  
  // For desktop loop, we double the tests to avoid jumpiness on small slide counts
  // But on mobile, we keep it exactly as-is for native scroll behavior
  const displayTestimonials = !isMobile ? [...items, ...items] : items;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'start',
      active: !isMobile,
      duration: 35, // Slightly slower for a more premium feel
      skipSnaps: false, // Ensure we hit every snap point cleanly
      watchDrag: (api, event) => {
        if (event.target && 'closest' in event.target) {
          // Type casting for safety, though DOM elements will have .closest
          return !(event.target as HTMLElement).closest('.embla__no-drag');
        }
        return true;
      }
    }
  );

  const teaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopTease = useCallback(() => {
    if (teaseTimerRef.current) {
      clearTimeout(teaseTimerRef.current);
      teaseTimerRef.current = null;
    }
  }, []);

  const scrollPrev = useCallback(() => {
    stopTease();
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi, stopTease]);

  const scrollNext = useCallback(() => {
    stopTease();
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi, stopTease]);

  useEffect(() => {
    if (!emblaApi || isMobile) return;
    
    emblaApi.on('pointerDown', stopTease);
    
    let hasTriggered = false;
    
    // Auto-advance once beautifully each time cards enter viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!hasTriggered) {
              teaseTimerRef.current = setTimeout(() => {
                if (emblaApi) emblaApi.scrollNext();
              }, 1200);
              hasTriggered = true;
            }
          } else if (entry.intersectionRatio === 0) {
            // Only reset if completely, 100% scrolled off the entire screen
            hasTriggered = false;
          }
        });
      },
      { threshold: [0, 0.5] }
    );

    const node = emblaApi.rootNode();
    if (node) observer.observe(node);

    return () => {
      observer.disconnect();
      stopTease();
      emblaApi.off('pointerDown', stopTease);
    };
  }, [emblaApi]);

  return (
    <section className="py-24 bg-[#FFF8E9] overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">

        <div className="flex justify-between items-end mb-12">
          <h2 className="font-bruta text-[2.3rem] md:text-5xl uppercase text-black leading-tight">
            What our <span className="text-[#FF5507]">Customers Say</span>
          </h2>

          {/* Desktop Navigation Buttons */}
          <div className="hidden md:flex gap-4">
            <button
              aria-label="Previous Testimonial"
              onClick={scrollPrev}
              className="w-12 h-12 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              aria-label="Next Testimonial"
              onClick={scrollNext}
              className="w-12 h-12 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div 
          className={cn(
            "relative overflow-x-auto md:overflow-hidden scrollbar-hide",
            isMobile && "snap-x snap-mandatory"
          )}
          ref={emblaRef}
        >
          <div className="flex -ml-4 md:-ml-6">
            {displayTestimonials.map((item, index) => (
              <div key={`${index}-${(item as any).author}`} className={cn(
                "flex-[0_0_85vw] md:flex-[0_0_45%] lg:flex-[0_0_35%] min-w-0 pl-4 md:pl-6",
                isMobile && "snap-center"
              )}>
                <div className="relative bg-[#EFE2D2] p-6 md:p-8 rounded-2xl h-full flex flex-col shadow-sm">

                  {/* Header: Image + Logo */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-black/5 flex items-center justify-center bg-white/50">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.author}
                          width="64"
                          height="64"
                          loading="lazy"
                          className="w-full h-full object-cover grayscale opacity-90 contrast-125"
                        />
                      ) : (
                        <span className="text-[#FF5507] font-bold text-xl uppercase tracking-tighter">
                          {getInitials(item.author)}
                        </span>
                      )}
                    </div>
                    <div className="h-8">
                      {item.logo && (
                        <img
                          src={item.logo}
                          alt="Company Logo"
                          width="auto"
                          height="32"
                          loading="lazy"
                          className="h-full w-auto object-contain brightness-0 flex-shrink-0"
                        />
                      )}
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-black text-black" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="flex-grow mb-6 relative z-10">
                    <p className={cn(
                      "font-recoleta text-black leading-relaxed select-text cursor-text embla__no-drag inline",
                      item.quote.length > 200 
                        ? "text-base md:text-lg" 
                        : "text-lg md:text-xl"
                    )}>
                      "{item.quote}"
                    </p>
                  </blockquote>

                  {/* Author / Desktop Controls (hidden on mobile native scroll) */}
                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between md:block relative">
                    <p className="font-bold text-sm uppercase tracking-wider text-black text-center md:text-left w-full">
                      {item.author}
                    </p>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}