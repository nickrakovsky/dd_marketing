import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface CTAFormProps {
  buttonText?: string;
  placeholder?: string;
}

const BLOCKED_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "mail.com",
  "yandex.com",
]);

function isBusinessEmail(email: string) {
  const parts = String(email || "").trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  return !!parts[1] && !BLOCKED_DOMAINS.has(parts[1]);
}

export default function CTAForm({
  buttonText = "Get Free Demo",
  placeholder = "Enter your work email",
}: CTAFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pagePath, setPagePath] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPagePath(window.location.pathname);
    }
  }, []);

  const calendlyUrl =
    "https://calendly.com/nick-rakovsky/datadocks-demo?primary_color=FF5722";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = (e.currentTarget.querySelector('input[name="email"]') as HTMLInputElement)?.value?.trim();

    if (!email || !isBusinessEmail(email)) {
      setError("Please use a business email address.");
      return;
    }

    setError("");

    // Client-side identify
    if (typeof window !== "undefined" && typeof (window as any).bento?.identify === "function") {
      (window as any).bento.identify(email);
    }

    // Server-side proxy — ad-blocker proof
    fetch('/api/bento-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        event: 'Demo Subscriber',
        source: pagePath,
        landingPage: sessionStorage.getItem('dd_landing_page') || window.location.href,
        visitorUuid: typeof (window as any).getBentoVisitorUuid === 'function'
          ? (window as any).getBentoVisitorUuid()
          : null,
      }),
      keepalive: true,
    }).catch(() => {});

    setIsSubmitted(true);
    window.open(calendlyUrl + '&email=' + encodeURIComponent(email), "_blank", "noopener");
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
        noValidate
        className={`${isSubmitted ? 'hidden' : 'flex'} flex-col animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-none`}
      >
        <div className="flex flex-row items-stretch gap-0">
          <div className="relative flex-1">
            <Input
              id="hero-email"
              type="email"
              name="email"
              placeholder={placeholder}
              onChange={() => setError("")}
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
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <p className="mt-2 px-1 text-xs font-recoleta text-primary">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}