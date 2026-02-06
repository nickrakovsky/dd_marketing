import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    quote: "We've had great results and the DataDocks team has been accommodating in making the software fit with what we need. It has helped streamline things on our end so much.",
    author: "Carla Thorel, ClearTech",
    image: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/645d08a96832e8883732d790_6453b6ddd92c58d0e657d749_carla-thorel%20(1).webp",
    logo: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/6453b6d83e05a6740876fce6_cleartech.svg"
  },
  {
    quote: "DataDocks blew the competition out of the water. They are quick and timely in their responses, and very easy to work with. I recommend them for anyone who needs more than an off the shelf appointment scheduling solution.",
    author: "Salah El-Jamil, AJC Logistics",
    image: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/6453b6ccc2dfb5702a926669_Salah%20El-Jamil.jpg",
    logo: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/6453b6c5acd68a66697b90d8_AJC.svg"
  },
  {
    quote: "The integration process has been seamless, and the tool is easy for our vendors to use. Whenever we need them, the team is quick to help us resolve any issues.",
    author: "Lina Wong, Stitch Fix",
    image: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/6453b6ece169146497ed9a14_lina%20wong.jpg",
    logo: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/6453b6f5aa190d778d116c9e_stitch%20fix.svg"
  },
  {
    quote: "It's not an expense but an investment. My team loves DataDocks. I don’t know how we lived without it.",
    author: "Andres Enderica, Atlantic Autocold",
    image: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/6453b72b51a046e1545027f8_Andres%20Enderica.jpg",
    logo: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/6453b73045179cf15ed30416_Atlantic%20Autocold.svg"
  }
];

export default function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="py-24 bg-[#FFF8E9] overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        
        <div className="flex justify-between items-end mb-12">
          <h2 className="font-bruta text-4xl md:text-5xl uppercase text-black">
            What our <span className="text-[#FF5507]">Customers Say</span>
          </h2>
          
          {/* Navigation Buttons */}
          <div className="hidden md:flex gap-4">
            <button 
              onClick={scrollPrev}
              className="w-12 h-12 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={scrollNext}
              className="w-12 h-12 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Carousel Viewport */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {testimonials.map((item, index) => (
              <div key={index} className="flex-[0_0_100%] md:flex-[0_0_45%] lg:flex-[0_0_35%] min-w-0">
                <div className="bg-white p-8 rounded-2xl border border-[#EFE2D2] h-full flex flex-col shadow-sm">
                  
                  {/* Header: Image + Logo */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-100">
                      <img 
                        src={item.image} 
                        alt={item.author} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="h-8">
                      <img 
                        src={item.logo} 
                        alt="Company Logo" 
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  </div>

                  {/* Quote */}
                  <blockquote className="flex-grow mb-6">
                    <p className="font-recoleta text-lg text-gray-800 leading-relaxed">
                      "{item.quote}"
                    </p>
                  </blockquote>

                  {/* Author */}
                  <div className="pt-6 border-t border-gray-100">
                    <p className="font-bold text-sm uppercase tracking-wider text-gray-500">
                      {item.author}
                    </p>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Navigation (Visible only on small screens) */}
        <div className="flex md:hidden justify-center gap-4 mt-8">
            <button 
              onClick={scrollPrev}
              className="w-12 h-12 rounded-full border border-black flex items-center justify-center bg-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={scrollNext}
              className="w-12 h-12 rounded-full border border-black flex items-center justify-center bg-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
        </div>

      </div>
    </section>
  );
}