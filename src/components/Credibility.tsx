import { Clock, CheckCircle2, Shield, Globe, Lock } from "lucide-react";
import type { CredibilityContent } from "@/data/pagesData";

interface CredibilityProps {
  content: CredibilityContent;
  images: {
    capterra: string;
    g2: string;
  };
}

const Credibility = ({ content, images }: CredibilityProps) => {
  const ANIMATION_DURATION = "50s";

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted border-y border-border overflow-hidden">
      <div className="w-full max-w-[1200px] mx-auto">
        <style>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: scroll ${ANIMATION_DURATION} linear infinite;
          }
          .mask-fade-edges {
            mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
          }
        `}</style>

        {/* --- DESKTOP VIEW (Static Banner) --- */}
        <div className="hidden lg:flex justify-between items-stretch w-full gap-3">
          <BadgeList mode="desktop" content={content} images={images} />
        </div>

        {/* --- MOBILE & TABLET VIEW (Infinite Carousel) --- */}
        <div className="lg:hidden relative w-[calc(100%+2rem)] -mx-4 overflow-hidden mask-fade-edges">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            <div className="flex gap-3 px-4">
              <BadgeList mode="carousel" content={content} images={images} />
            </div>
            <div className="flex gap-3 px-4">
              <BadgeList mode="carousel" content={content} images={images} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ... BadgeList Component (Keep existing code) ...
// (I am omitting the BadgeList function here to save space, but DO NOT DELETE IT from your file)
// Make sure BadgeList is still present below the main component.
const BadgeList = ({ mode, content, images }: { mode: "carousel" | "desktop"; content: CredibilityContent; images: { capterra: string; g2: string } }) => {
  const isDesktop = mode === "desktop";

  const cardContainerClass = `relative rounded-xl flex items-center transition-all hover:opacity-90 select-none
    ${isDesktop ? "flex-1 min-w-0 h-[56px] px-2 xl:px-4 shadow-sm" : "w-[180px] h-[50px] px-3 flex-shrink-0"}`;

  return (
    <>
      {/* 1. G2 BADGE */}
      <a
        href={content.g2Link}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cardContainerClass} bg-[#FF492C] gap-3`}
      >
        <div className={`flex items-center justify-center flex-shrink-0 ${isDesktop ? "h-10 w-10" : "h-8 w-8"}`}>
          <img src={images.g2} alt="G2" className="w-full h-full object-contain" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
          <div className="flex gap-0.5 mb-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} className={isDesktop ? "w-3.5 h-3.5" : "w-3 h-3"} viewBox="0 0 24 24" fill="#FFD700">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            ))}
          </div>
          <div className={`font-bold text-white whitespace-nowrap leading-none ${isDesktop ? "text-sm" : "text-sm"}`}>
            {content.g2Rating}
          </div>
        </div>
      </a>

      {/* 2. UPTIME */}
      <div className={`${cardContainerClass} bg-card border border-border/50 gap-3 group`}>
        <div
          className={`rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary ${isDesktop ? "h-10 w-10" : "h-9 w-9"}`}
        >
          <Clock className={isDesktop ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col justify-center text-left min-w-0">
          <span
            className={`font-black text-card-foreground leading-tight whitespace-nowrap ${isDesktop ? "text-lg xl:text-xl" : "text-lg"}`}
          >
            {content.uptimePercentage}
          </span>
          <span
            className={`font-medium text-muted-foreground uppercase tracking-wide leading-none ${isDesktop ? "text-[10px] xl:text-[11px]" : "text-[10px]"}`}
          >
            {content.uptimeLabel}
          </span>
        </div>
      </div>

      {/* 3. CAPTERRA */}
      <a
        href={content.capterraLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cardContainerClass} bg-[#134B70] gap-2 xl:gap-3 pr-4`}
      >
        <img src={images.capterra} alt="Capterra" className={`${isDesktop ? "h-6 w-6" : "h-6 w-6"} flex-shrink-0`} />

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className={`text-white font-bold whitespace-nowrap leading-tight ${isDesktop ? "text-sm" : "text-sm"}`}>
            Capterra
          </div>
          <div className="flex gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} className={isDesktop ? "w-2.5 h-2.5" : "w-2 h-2"} viewBox="0 0 24 24" fill="#FF8C00">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            ))}
          </div>
        </div>
        <div className="h-3/5 w-px bg-white/20 mx-1 flex-shrink-0"></div>
        <div className={`text-[#89CDE8] font-bold flex-shrink-0 ${isDesktop ? "text-lg xl:text-xl" : "text-lg"}`}>
          {content.capterraRating}
        </div>
      </a>

      {/* 4. SUPPORT */}
      <div className={`${cardContainerClass} bg-card border border-border/50 gap-3`}>
        <div
          className={`rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary ${isDesktop ? "h-10 w-10" : "h-9 w-9"}`}
        >
          <CheckCircle2 className={isDesktop ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col justify-center text-left min-w-0">
          <span
            className={`font-black text-card-foreground leading-tight whitespace-nowrap ${isDesktop ? "text-lg xl:text-xl" : "text-lg"}`}
          >
            {content.supportHours}
          </span>
          <span
            className={`font-medium text-muted-foreground uppercase tracking-wide leading-none ${isDesktop ? "text-[10px] xl:text-[11px]" : "text-[10px]"}`}
          >
            {content.supportLabel}
          </span>
        </div>
      </div>

      {/* 5. SECURITY */}
      <div
        className={`${cardContainerClass} bg-gradient-to-br from-[#007DF1] to-[#0052cc] border border-blue-400/30 overflow-hidden !px-0`}
      >
        <div className={`flex items-center justify-between w-full h-full ${isDesktop ? "px-2 xl:px-4" : "px-3"}`}>
          {/* ISO */}
          <div className="flex items-center gap-1 z-10 flex-shrink-0">
            <Globe className={`text-blue-100 ${isDesktop ? "w-3.5 h-3.5" : "w-3.5 h-3.5"}`} strokeWidth={2.5} />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-white text-[10px]">{content.securityBadges.iso}</span>
              <span className="font-medium text-blue-100 text-[9px]">{content.securityBadges.isoSubtext}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-blue-400/50 mx-0.5 flex-shrink-0"></div>

          {/* GDPR */}
          <div className="flex items-center gap-1 z-10 flex-shrink-0">
            <Lock className={`text-blue-100 ${isDesktop ? "w-3.5 h-3.5" : "w-3.5 h-3.5"}`} strokeWidth={2.5} />
            <span className="font-extrabold text-white text-[10px]">{content.securityBadges.gdpr}</span>
          </div>

          <div className="h-6 w-px bg-blue-400/50 mx-0.5 flex-shrink-0"></div>

          {/* SOC 2 */}
          <div className="flex items-center gap-1 z-10 flex-shrink-0">
            <Shield className={`text-blue-100 ${isDesktop ? "w-3.5 h-3.5" : "w-3.5 h-3.5"}`} strokeWidth={2.5} />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-white text-[10px]">{content.securityBadges.soc2}</span>
              <span className="font-medium text-blue-100 text-[9px]">{content.securityBadges.soc2Subtext}</span>
            </div>
          </div>
        </div>

        {/* Shine Effects */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" width="100%" height="100%">
          <pattern id="hexagons" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M10 0L20 5V15L10 20L0 15V5L10 0Z" fill="currentColor" className="text-white" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none mix-blend-overlay"></div>
      </div>
    </>
  );
};

export default Credibility;