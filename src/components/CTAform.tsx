import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CTAFormProps {
  buttonText?: string;
  placeholder?: string;
  onSuccess?: () => void;
}

export default function CTAForm({ buttonText = "Get Free Demo", placeholder = "Enter your work email", onSuccess }: CTAFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // FIX: Pointing to local server route (proxies to Bento securely)
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Server error");
      }

      setStatus('success');
      toast.success("Success! Please select a time below.");
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-md flex items-center justify-center gap-2 mb-4 sm:mb-6 h-10 md:h-16 bg-background border border-primary/20 animate-in fade-in zoom-in font-recoleta font-normal rounded-none">
        <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        <span className="text-sm md:text-xl text-muted-foreground">Details received! Select a time below ↓</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg flex flex-row items-stretch gap-0 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-none">
      <div className="relative flex-1">
        <Input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder={placeholder} 
          required 
          disabled={status === 'loading'}
          // FINAL DESIGN SPECS:
          // Mobile: h-10 (40px) & text-sm
          // Desktop: md:h-16 (64px) & md:text-xl
          className="w-full h-10 md:h-16 border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-4 md:px-6 font-recoleta font-normal text-sm md:text-xl bg-background text-muted-foreground placeholder:text-muted-foreground/60" 
        />
      </div>
      <Button 
        type="submit" 
        variant="default" 
        size="lg" 
        disabled={status === 'loading'}
        className="whitespace-nowrap h-10 md:h-16 bg-black hover:bg-primary text-white font-recoleta font-normal transition-colors duration-300 rounded-none px-6 md:px-8 text-sm md:text-xl shadow-none border-0"
      >
        {status === 'loading' ? (
           <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
        ) : (
          <div className="flex items-center gap-2">
            {buttonText}
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        )}
      </Button>
    </form>
  );
}