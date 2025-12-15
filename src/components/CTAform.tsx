import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const BENTO_SITE_UUID = import.meta.env.PUBLIC_BENTO_SITE_UUID; 
const BENTO_PUBLISHABLE_KEY = import.meta.env.PUBLIC_BENTO_KEY; 
const BENTO_SUBSCRIBE_URL = "https://app.bentonow.com/api/v1/fetch/subscribers";

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
    const authHeader = "Basic " + btoa(BENTO_PUBLISHABLE_KEY + ":");

    try {
      const res = await fetch(BENTO_SUBSCRIBE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify({ site_uuid: BENTO_SITE_UUID, email: email }),
      });
      if (!res.ok) throw new Error(`Bento API error: ${res.statusText}`);

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
      <div className="mx-auto max-w-md flex items-center justify-center gap-2 mb-4 sm:mb-6 h-16 bg-background border border-primary/20 animate-in fade-in zoom-in font-recoleta font-normal rounded-none">
        <CheckCircle2 className="h-6 w-6 text-primary" />
        <span className="text-xl text-muted-foreground">Details received! Select a time below ↓</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg flex flex-row items-stretch gap-0 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-none">
      <div className="relative flex-1">
        <Input 
          type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={placeholder} required disabled={status === 'loading'}
          // UPDATED:
          // text-4xl -> Fills the 64px container prominently
          // text-muted-foreground -> Inherits Dark Beige (#8d785c) from global.css
          // bg-background -> Inherits Old Lace (#FFF8E9)
          className="w-full h-16 border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-6 font-recoleta font-normal text-4xl bg-background text-muted-foreground placeholder:text-muted-foreground/60" 
        />
      </div>
      <Button type="submit" variant="default" size="lg" disabled={status === 'loading'}
        className="whitespace-nowrap h-16 bg-black hover:bg-primary text-white font-recoleta font-normal transition-colors duration-300 rounded-none px-8 text-xl shadow-none border-0"
      >
        {status === 'loading' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <div className="flex items-center gap-2">{buttonText}<ArrowRight className="h-5 w-5" /></div>}
      </Button>
    </form>
  );
}