import type { ReactNode } from "react";
import CTAForm from "../CTAform"; 

interface HeroInteractionProps {
  buttonText?: string;
  placeholder?: string;
  children: ReactNode;
  fitContent?: boolean;
}

export default function HeroInteraction({ 
  buttonText, 
  placeholder, 
  children,
  fitContent = false 
}: HeroInteractionProps) {
  
  return (
    <div className="flex flex-col items-center w-full">
      <CTAForm 
        buttonText={buttonText} 
        placeholder={placeholder} 
      />

      {/*
        `md:w-[42rem]` replaces what used to be `md:w-fit`. `w-fit` is
        shrink-to-fit, and the hero image inside is `w-full` — a circular
        dependency the browser resolves using the image's INTRINSIC width, which
        is 0 until its bytes arrive. So this container laid out at ~18px wide and
        then snapped to its real width when the image landed: a 0.105 layout
        shift on desktop, enough to fail CLS on its own. 42rem matches the
        `max-w-2xl` of the gallery wrapper inside, so the rendered result is
        identical — it is just a definite width the browser can use immediately.
        Do not change this back to a content-based width (`w-fit`, `w-max`,
        `w-min`) without re-checking desktop CLS on a throttled connection.
      */}
      <div className={`
        relative mt-8 transition-all duration-700 ease-in-out
        ${fitContent
          ? 'w-full md:w-[42rem]'
          : 'w-full max-w-md md:max-w-5xl 2xl:max-w-[75%] 2xl:w-fit'
        }
      `}>
        <div className="absolute -inset-4 rounded-2xl bg-primary-foreground/20 blur-3xl block"></div>
        
        <div className="relative rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 p-0 sm:p-2 shadow-custom-lg backdrop-blur-sm overflow-hidden">
          <div className="w-full h-full rounded-xl">
             {children}
          </div>
        </div>
      </div>
    </div>
  );
}