import type { ReactNode } from "react";
import CTAForm from "./CTAform"; 

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

      <div className={`
        relative mt-8 transition-all duration-700 ease-in-out
        ${fitContent 
          ? 'w-full md:w-fit' 
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