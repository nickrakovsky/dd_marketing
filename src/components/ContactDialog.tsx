import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export function ContactDialog() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [pagePath, setPagePath] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPagePath(window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Sending page path here too
        body: JSON.stringify({ email, message, type: "ContactUs", page: pagePath }),
      });

      if (!response.ok) throw new Error("Something went wrong");

      setIsSuccess(true);
      setEmail("");
      setMessage("");
    } catch (err) {
      setError("Failed to submit. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="cursor-pointer text-primary hover:text-primary-glow transition-colors font-semibold">
          Get in touch with our team
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] sm:rounded-none">
        <DialogHeader>
          <DialogTitle>Get in touch</DialogTitle>
          <DialogDescription>
            Tell us a bit about your needs and we'll reach out to help.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="text-green-600 font-medium text-lg">Thanks for reaching out!</div>
            <p className="text-sm text-muted-foreground">
              We've received your info and will be in touch shortly.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsSuccess(false)}
              className="mt-4 rounded-none"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="work@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="rounded-none"
              />
            </div>
            
            <div className="space-y-2">
              <Textarea
                placeholder="How can we help you?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
                className="resize-none rounded-none min-h-[100px]"
              />
            </div>
            
            <p className="text-[10px] text-muted-foreground leading-tight">
              By submitting this form, you agree to receive communications from DataDocks. 
              You can unsubscribe at any time.
            </p>

            {error && <p className="text-sm text-red-500">{error}</p>}
            
            <Button type="submit" className="w-full rounded-none" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}