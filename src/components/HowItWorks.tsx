import { Upload, ToggleRight, RefreshCw, FileText, ArrowRight } from "lucide-react";

import type { HowItWorksContent } from "@/data/pagesData";

interface HowItWorksProps {
  content: HowItWorksContent;
}

// ==========================================
// 1. ASSETS & ICONS
// ==========================================

const getIcon = (iconName: "upload" | "toggle" | "refresh") => {
  const icons = { upload: Upload, toggle: ToggleRight, refresh: RefreshCw };
  return icons[iconName];
};

const MobileArrowRight = () => (
  <svg viewBox="0 0 60 140" fill="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 0 C 10 50, 45 60, 45 140" stroke="#FF9E7D" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M45 140 L 37 130 M 45 140 L 53 130" stroke="#FF9E7D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MobileArrowLeft = () => (
  <svg viewBox="0 0 60 140" fill="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0 C 50 50, 15 60, 15 140" stroke="#FF9E7D" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M15 140 L 7 130 M 15 140 L 23 130" stroke="#FF9E7D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BackgroundPattern = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg" opacity="0.4">
      <defs>
        <pattern id="matrix-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#FF9E7D" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#matrix-dots)" />
    </svg>
  </div>
);

// ==========================================
// 2. SUB-COMPONENTS
// ==========================================

const CommentBox = ({ text, className = "" }: { text: string; className?: string }) => (
  <div className={`bg-[#FF9E7D] text-white px-4 py-3 rounded-lg shadow-md text-[11px] lg:text-[13px] xl:text-sm font-recoleta italic leading-tight border-2 border-white/40 relative z-10 ${className}`}>
    {text}
  </div>
);

const StepCard = ({ step, isLast }: { step: any; isLast: boolean }) => {
  const Icon = getIcon(step.icon);

  return (
    <div
      className={`w-full border rounded-xl p-4 sm:p-6 shadow-lg relative hover:shadow-glow transition-all bg-card z-20 ${
        step.highlight
          ? "border-2 border-primary/20 shadow-glow"
          : isLast
            ? "bg-foreground border-border text-background md:pb-8"
            : "border-border"
      }`}
    >
      <div className="absolute -top-3 -left-3 h-8 w-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-bold text-xs shadow-glow">
        STEP {step.stepNumber}
      </div>

      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${isLast ? "bg-background/10" : "bg-primary/10"}`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isLast ? "text-primary" : "text-primary"}`} />
        </div>
        <div>
          <h3 className={`font-recoleta font-semibold mb-1 sm:mb-2 text-sm sm:text-base ${isLast ? "" : "text-foreground"}`}>
            {step.title}
          </h3>
          <p className={`text-xs sm:text-sm ${isLast ? "opacity-80" : "text-muted-foreground"}`}>{step.description}</p>
        </div>
      </div>

      {step.visualTags && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border flex justify-center gap-2 items-center">
          {step.visualTags.map((tag: string) => (
            <span key={tag} className="text-[10px] font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
              {tag}
            </span>
          ))}
          <ArrowRight size={14} className="text-muted-foreground" />
          <FileText size={16} className="text-primary" />
        </div>
      )}
    </div>
  );
};

const MobileConnector = ({ index, annotation }: { index: number; annotation?: string }) => {
  const isEven = index % 2 === 0;

  return (
    <div className={`md:hidden relative w-full h-[140px] -my-6 flex items-center justify-between px-1 z-10`}>
      {isEven ? (
        <>
          <div className="w-2/3 pl-1 h-full flex items-center">
            {annotation && <CommentBox text={annotation} className="transform -rotate-2 origin-top-right -mt-16" />}
          </div>
          <div className="w-1/3 h-full flex justify-center pb-2">
            <div className="h-full w-[60px] p-2">
              <MobileArrowRight />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="w-1/3 h-full flex justify-end pr-6 pb-8">
            <div className="h-full w-[60px] p-2">
              <MobileArrowLeft />
            </div>
          </div>
          <div className="w-2/3 pr-1 h-full flex items-center justify-end">
            {annotation && <CommentBox text={annotation} className="transform rotate-2 origin-bottom-left mt-8" />}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

const HowItWorks = ({ content }: { content: HowItWorksContent }) => {
  
  // Helper to safely parse the footer annotation
  const getFooterParts = (text: string) => {
    if (!text.includes(":")) return { label: "Note", body: text };
    
    const [label, ...rest] = text.split(":");
    const body = rest.join(":").trim();
    const cleanBody = body.replace(/^[\(\s]+|[\)\s]+$/g, '');
    
    return { label, body: cleanBody };
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-x-clip">
      <BackgroundPattern />

      <div className="w-full max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bruta font-bold tracking-tight text-foreground sm:text-4xl">{content.title}</h2>
          <p className="text-muted-foreground mt-3 font-recoleta text-sm sm:text-base">{content.subtitle}</p>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="absolute top-6 bottom-12 w-0.5 bg-border border-l-2 border-dashed left-1/2 -translate-x-1/2 hidden md:block z-0"></div>

          {content.steps.map((step, index) => {
            const isLastStep = index === content.steps.length - 1;

            return (
              <div key={step.stepNumber} className="w-full flex flex-col items-center relative">
                {/* DESKTOP: SYMMETRICAL GRID */}
                <div className="hidden md:grid grid-cols-[1fr_2fr_1fr] gap-2 w-full relative z-20 mb-8 items-start">
                  <div className="flex justify-end pr-0 opacity-0 pointer-events-none" aria-hidden="true">
                    <div className="w-full max-w-[240px]" />
                  </div>

                  <div className="relative">
                    <StepCard step={step} isLast={isLastStep} />

                    {/* DESKTOP FOOTER ANNOTATION */}
                    {isLastStep && content.footerAnnotation && (
                      <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 w-max">
                        <div className="bg-[#FDF8F6] border border-dashed border-border rounded-full px-8 py-2 shadow-sm">
                          <p className="text-muted-foreground font-medium text-xs flex items-center justify-center gap-2">
                            {(() => {
                              const { label, body } = getFooterParts(content.footerAnnotation);
                              return (
                                <>
                                  <span className="text-primary font-bold">{label}:</span>
                                  <span>({body})</span>
                                </>
                              );
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-start pl-0 pt-6">
                    {step.desktopAnnotation && (
                      <div className="flex items-start w-full">
                        <span className="text-[#FF9E7D] text-2xl mr-2 -mt-1 flex-shrink-0">←</span>
                        <CommentBox text={step.desktopAnnotation} className="w-full max-w-[240px] rotate-2" />
                      </div>
                    )}
                  </div>
                </div>

                {/* MOBILE STACK */}
                <div className="md:hidden w-full flex flex-col items-center relative z-20">
                  <div className={`w-full relative z-20`}>
                    <StepCard step={step} isLast={isLastStep} />
                  </div>
                  
                  {/* Connector between steps (Space 1 & Space 2) */}
                  {!isLastStep && <MobileConnector index={index} annotation={step.mobileAnnotation} />}
                </div>

                <div className="hidden md:block h-4"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;