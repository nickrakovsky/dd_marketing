import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface CTAFormProps {
  buttonText?: string;
  placeholder?: string;
}

const blockedDomains = new Set([
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

function getDomain(email: string) {
  const parts = String(email || "").trim().toLowerCase().split("@");
  return parts.length === 2 ? parts[1] : "";
}

function isBusinessEmail(email: string) {
  const domain = getDomain(email);
  return !!domain && !blockedDomains.has(domain);
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

    const email =
      (
        e.currentTarget.querySelector(
          'input[name="email"]'
        ) as HTMLInputElement | null
      )?.value?.trim() || "";

    setError("");

    if (!isBusinessEmail(email)) {
      setIsSubmitted(false);
      setError("Please enter your business email address.");
      return;
    }

    if (email && (window as any).bento) {
      (window as any).bento.identify(email);
      (window as any).bento.track("Demo Subscriber", { source: pagePath });
    }

    setIsSubmitted(true);

    const url = new URL(calendlyUrl);
    url.searchParams.set("email", email);

    window.open(url.toString(), "_blank", "noopener");
  };

  return (
    <div className="mx-auto max-w-lg mb-8">
      <div
        className={`${
          isSubmitted ? "flex" : "hidden"
        } flex-col items-center justify-center gap-2 h-16 bg-background/50 border border-primary/20 animate-in fade-in zoom-in rounded-none p-4`}
      >
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-recoleta text-lg">
            Opening calendar in a new tab...
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Popup blocked?{" "}
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-primary"
          >
            Click here to book
          </a>
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`${
          isSubmitted ? "hidden" : "flex"
        } flex-row items-stretch gap-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-none`}
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

      {!isSubmitted && error && (
        <p className="mt-3 text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}