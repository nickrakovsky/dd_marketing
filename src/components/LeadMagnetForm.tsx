import { useState, useEffect } from "react";

interface LeadMagnetFormProps {
  headline: string;
  buttonText?: string;
  eventName: string;
  redirectUrl: string;
}

const BENTO_UUID = "b4cb9a34a989bcc643714151df7b7154";

export default function LeadMagnetForm({
  headline,
  buttonText = "Download",
  eventName,
  redirectUrl,
}: LeadMagnetFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pagePath, setPagePath] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPagePath(window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.querySelector('input[name="email"]') as HTMLInputElement)?.value || "";

    // Submit to Bento via fetch (no-cors = fire-and-forget, data reaches server)
    // No ?hardened=true so we don't need cross-origin cookies
    const formData = new FormData();
    formData.append("email", email);
    formData.append("redirect", redirectUrl);
    formData.append("fields[source]", pagePath);

    fetch(`https://track.bentonow.com/forms/${BENTO_UUID}/${eventName}`, {
      method: "POST",
      body: formData,
      mode: "no-cors",
    }).catch(() => {});

    setIsSubmitted(true);
    window.open(redirectUrl, "_blank", "noopener");
  };

  return (
    <div className="my-8 not-prose">
      {/* SUCCESS — shown via CSS, not conditional unmount */}
      <div className={`${isSubmitted ? "block" : "hidden"} w-full bg-[#FFF8EE] border-2 border-black/15 p-6 text-center`}>
        <div className="flex items-center justify-center gap-2 text-green-700 font-bold font-recoleta text-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Check your email for the download!
        </div>
        <p className="text-sm text-gray-500 mt-2 font-recoleta">
          Didn't get it? Check your spam folder or{" "}
          <a href={redirectUrl} target="_blank" rel="noreferrer" className="underline text-[#fd4f00]">
            download directly
          </a>.
        </p>
      </div>

      {/* FORM — hidden via CSS so native submission isn't cancelled on state change */}
      <form
        onSubmit={handleSubmit}
        className={`${isSubmitted ? "hidden" : "block"} w-full bg-[#FFF8EE] border-2 border-black/15 shadow-sm p-5 sm:p-6`}
      >
        <div className="font-recoleta font-bold text-gray-800 text-lg sm:text-xl mb-4">
          {headline}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className="w-full sm:flex-1 h-12 px-4 bg-white border-2 border-gray-300 text-gray-800 text-base font-recoleta placeholder:text-gray-400 focus:border-[#fd4f00] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="w-full sm:w-auto h-12 px-8 bg-[#FE5000] hover:bg-[#e54700] text-white font-recoleta font-bold text-base shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            {buttonText}
          </button>
        </div>
      </form>

      <p className={`${isSubmitted ? "hidden" : "block"} text-center text-sm text-gray-400 mt-3 font-recoleta`}>
        You'll also receive occasional updates from us. You can unsubscribe at any time.
      </p>
    </div>
  );
}
