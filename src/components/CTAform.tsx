import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

interface CTAFormProps {
  buttonText?: string;
  placeholder?: string;
  ctaId?: string;
}

export default function CTAForm({ buttonText = "Book a Demo", placeholder = "Enter your work email", ctaId = "benefit-hero" }: CTAFormProps) {
  return (
    <div className="mx-auto max-w-lg mb-8">

      <form
        data-lead-capture data-cta-id={ctaId} data-cta-placement="hero"
        className="flex flex-row items-stretch gap-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-none"
      >

        <div className="relative flex-1">
          <Input
            id={`${ctaId}-email`}
            aria-label="Email address"
            autoComplete="email"
            type="email"
            name="email"
            placeholder={placeholder}
            required
            className="w-full h-10 md:h-16 border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-4 md:px-6 font-recoleta font-normal text-sm md:text-xl bg-background text-muted-foreground placeholder:text-muted-foreground/60"
          />
        </div>
        <Button
          type="submit"
          variant="default"
          size="lg"
          className="whitespace-nowrap h-10 md:h-16 bg-black hover:bg-primary text-white font-recoleta font-normal transition-colors duration-300 rounded-none px-6 md:px-8 text-sm md:text-xl shadow-none border-0"
        >
          <div className="flex items-center gap-2">
            {buttonText}
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </Button>
      </form>
    </div>
  );
}
