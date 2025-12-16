import { Star } from "lucide-react";
import type { TestimonialContent } from "@/data/pagesData";

interface TestimonialProps {
  content: TestimonialContent;
}

const Testimonial = ({ content }: TestimonialProps) => {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-4xl">
        <div className="relative rounded-2xl bg-card border border-border p-6 sm:p-8 lg:p-12 shadow-custom-lg">
          <div className="flex gap-1 mb-4 sm:mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-accent text-accent" />
            ))}
          </div>
          
          <blockquote className="text-base sm:text-xl lg:text-2xl font-recoleta font-medium text-card-foreground mb-6 sm:mb-8 leading-relaxed">
            "{content.quote}"
          </blockquote>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src={content.image} 
              alt={`${content.name} profile picture`} 
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover border-2 border-primary" 
            />
            <div>
              <div className="font-semibold text-card-foreground text-sm sm:text-base">{content.name}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{content.role}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;