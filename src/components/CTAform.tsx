import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Loader2 is unused
import { /* Loader2, */ ArrowRight, CheckCircle2 } from "lucide-react";
import { bentoCall } from "@/lib/bento";
import { CALENDLY_BOOKING_URL, CALENDLY_BRAND_PARAMS } from "@/lib/calendly-config.mjs";

interface CTAFormProps {
  buttonText?: string;
  placeholder?: string;
}

export default function CTAForm({ buttonText = "Book a Demo", placeholder = "Enter your work email" }: CTAFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pagePath, setPagePath] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPagePath(window.location.pathname);
    }
  }, []);

  const calendlyUrl = `${CALENDLY_BOOKING_URL}?${CALENDLY_BRAND_PARAMS}`;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = (e.currentTarget.querySelector('input[name="email"]') as HTMLInputElement)?.value;
    if (email) {
      const w = window as any;
      if (typeof w.ddSetEmail === 'function') w.ddSetEmail(email);
      bentoCall('identify', email);

      fetch('/api/bento-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          event: 'Demo Subscriber',
          source: pagePath,
          landingPage: sessionStorage.getItem('dd_landing_page') || window.location.href,
          visitorUuid: typeof w.getBentoVisitorUuid === 'function' ? w.getBentoVisitorUuid() : null,
          attribution: typeof w.ddGetAttribution === 'function' ? w.ddGetAttribution() : null,
        }),
        keepalive: true,
      }).catch(() => {});
    }
    setIsSubmitted(true);
    const ddOpen = (window as any).ddOpenCalendly;
    if (typeof ddOpen === 'function') {
      ddOpen(CALENDLY_BRAND_PARAMS);
    } else {
      window.open(calendlyUrl, "_blank", "noopener");
    }
  };

  return (
    <div className="mx-auto max-w-lg mb-8">

      {/* SUCCESS STATE */}
      <div className={`${isSubmitted ? 'flex' : 'hidden'} flex-col items-center justify-center gap-2 h-16 bg-background/50 border border-primary/20 animate-in fade-in zoom-in rounded-none p-4`}>
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-recoleta text-lg">Opening calendar in a new tab...</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Popup blocked? <a href={calendlyUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-primary">Click here to book</a>
        </p>
      </div>

      {/* FORM STATE */}
      <form
        onSubmit={handleSubmit}
        className={`${isSubmitted ? 'hidden' : 'flex'} flex-row items-stretch gap-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-none`}
      >

        <div className="relative flex-1">
          <Input
            id="hero-email"
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