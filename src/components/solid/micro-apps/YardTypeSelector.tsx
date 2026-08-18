/** @jsxImportSource solid-js */
import { For, Switch, Match, Show, createSignal, onCleanup, createMemo } from "solid-js";
import { createYardTypeEngine } from "./YardTypeEngine";
import type { SubCategory } from "./YardTypeEngine";
import type { JSX } from "solid-js";
import { bentoCall } from "@/lib/bento";
import { CALENDLY_BOOKING_URL, CALENDLY_BRAND_PARAMS } from "@/lib/calendly-config.mjs";

/* ── Primary Category Color Tint Overlays (Page 1) ── */

const PRIMARY_TINTS: Record<string, {
  overlayHex: string;
  opacityClass: string;
}> = {
  "freight-cargo": {
    overlayHex: "#fd4f00",     // Official Brand Orange (--datadocks-orange)
    opacityClass: "group-hover:opacity-[0.20]"
  },
  "mobile-asset-fleet": {
    overlayHex: "#2563eb",     // Fleet / Telematics Blue (--datadocks-blue-medium)
    opacityClass: "group-hover:opacity-[0.22]"
  },
  "heavy-industrial-bulk": {
    overlayHex: "#f59e0b",     // Industrial Safety Amber Gold
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "biological-environmental": {
    overlayHex: "#16a34a",     // Environmental Land Green (--datadocks-green-dark)
    opacityClass: "group-hover:opacity-[0.22]"
  }
};

/* ── Sub-category Color Tint Overlays (Page 2) ── */

const SUBCATEGORY_TINTS: Record<string, {
  overlayHex: string;
  opacityClass: string;
}> = {
  /* Category 1.0: Road Freight, Trailers or Containers */
  "warehouse-dc": {
    overlayHex: "#fd4f00",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "maritime-seaport": {
    overlayHex: "#0284c7",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "rail-intermodal-cargo": {
    overlayHex: "#7c3aed",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "equipment-chassis-depot": {
    overlayHex: "#d97706",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "customs-bonded-holding": {
    overlayHex: "#059669",
    opacityClass: "group-hover:opacity-[0.25]"
  },

  /* Category 2.0: Finished Vehicles, Public Transit or Commercial Fleets */
  "passenger-transit": {
    overlayHex: "#0284c7",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "finished-vehicles-salvage": {
    overlayHex: "#d97706",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "commercial-equipment": {
    overlayHex: "#7c3aed",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "freight-trucking-terminals": {
    overlayHex: "#0d9488",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "passenger-transit-depots": {
    overlayHex: "#2563eb",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "fvl-compounds": {
    overlayHex: "#9333ea",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "utility-service-fleet": {
    overlayHex: "#ca8a04",
    opacityClass: "group-hover:opacity-[0.25]"
  },

  /* Category 3.0: Industrial Stockpiles, Staging or Material Laydown */
  "construction-civil": {
    overlayHex: "#e11d48",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "energy-power-utility": {
    overlayHex: "#0284c7",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "piping-tubular-steel": {
    overlayHex: "#d97706",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "heavy-mfg-aerospace": {
    overlayHex: "#7c3aed",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "aggregate-mineral-quarry": {
    overlayHex: "#059669",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "bulk-packaging": {
    overlayHex: "#ea580c",
    opacityClass: "group-hover:opacity-[0.25]"
  },

  /* Category 4.0: Environmental Assets, Forestry or Agricultural Land */
  "forestry-timber": {
    overlayHex: "#15803d",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "agricultural-livestock": {
    overlayHex: "#b45309",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "civil-soil-remediation": {
    overlayHex: "#0d9488",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "livestock-stockyards": {
    overlayHex: "#c2410c",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "timber-log-yards": {
    overlayHex: "#15803d",
    opacityClass: "group-hover:opacity-[0.25]"
  },
  "agri-processing-depots": {
    overlayHex: "#b45309",
    opacityClass: "group-hover:opacity-[0.25]"
  }
};

/* ── Harmonized Motion Curves & Keyframes ── */

const STYLES = `
  @keyframes ytSubCardEnter {
    0%   { opacity: 0; transform: translate3d(0, 12px, 0) scale(0.985); }
    100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  }
  @keyframes ytCardExit {
    0%   { opacity: 1; transform: translate3d(0, 0, 0); }
    100% { opacity: 0; transform: translate3d(0, -8px, 0); }
  }
  @keyframes ytHeaderEnter {
    0%   { opacity: 0; transform: translate3d(0, -6px, 0); }
    100% { opacity: 1; transform: translate3d(0, 0, 0); }
  }
  @keyframes ytHeaderExit {
    0%   { opacity: 1; transform: translate3d(0, 0, 0); }
    100% { opacity: 0; transform: translate3d(0, -6px, 0); }
  }
  .yt-subcard-enter, .yt-card-enter {
    animation: ytSubCardEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .yt-card-exit {
    animation-name: ytCardExit;
    animation-duration: 160ms;
    animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
    animation-fill-mode: forwards;
  }
  .yt-header-enter {
    animation: ytHeaderEnter 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .yt-header-exit {
    animation: ytHeaderExit 220ms cubic-bezier(0.25, 1, 0.5, 1) both;
  }
`;

/** Helper to determine exact aspect ratio string for a sub-category card */
function getSubCardAspectRatio(is3Col: boolean, isTop2: boolean, count?: number): string {
  if (count === 3) return "320 / 511";
  if (is3Col) return "319 / 257";
  if (isTop2) return "508 / 224";
  return "1024 / 110";
}

/** Helper to compute target header thumbnail width in px for smooth CSS transition */
function computeHeaderThumbWidth(aspectStr: string | null): string {
  if (!aspectStr) return "0px";
  const parts = aspectStr.split("/").map((p) => parseFloat(p.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1]) || parts[1] === 0) return "0px";
  const ratio = parts[0] / parts[1];
  const heightPx = 76; // Scaled height matching header text column (h-[4.75rem])
  const calculatedWidth = Math.round(heightPx * ratio);
  return `${calculatedWidth}px`;
}

/* ── Next Steps CTA Card Component ── */

function NextStepsCard(props: {
  selectedSystemName: string;
  isDataDocks: boolean;
  subCategoryTitle: string;
  integrationEcosystem?: string;
}) {
  const [email, setEmail] = createSignal("");
  const [isSubmitted, setIsSubmitted] = createSignal(false);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const mail = email().trim();
    if (!mail) return;

    const w = window as any;
    if (typeof w.ddSetEmail === "function") w.ddSetEmail(mail);
    bentoCall("identify", mail);

    fetch("/api/bento-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: mail,
        event: props.isDataDocks ? "DataDocks Demo Request" : "YMS Shortlist Request",
        source: window.location.pathname,
        landingPage: sessionStorage.getItem("dd_landing_page") || window.location.href,
        visitorUuid: typeof w.getBentoVisitorUuid === "function" ? w.getBentoVisitorUuid() : null,
        attribution: typeof w.ddGetAttribution === "function" ? w.ddGetAttribution() : null,
        metadata: {
          selectedSystem: props.selectedSystemName,
          subCategory: props.subCategoryTitle,
        }
      }),
      keepalive: true,
    }).catch(() => {});

    setIsSubmitted(true);

    const ddOpen = w.ddOpenCalendly;
    if (typeof ddOpen === "function") {
      ddOpen(CALENDLY_BRAND_PARAMS);
    } else {
      window.open(`${CALENDLY_BOOKING_URL}?${CALENDLY_BRAND_PARAMS}`, "_blank", "noopener");
    }
  };

  return (
    <div
      class={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 ${
        props.isDataDocks
          ? "bg-gradient-to-br from-[#FFF8E9] via-[#F8EDD9]/60 to-[#FFF8E9] border-[#fd4f00]/30 shadow-xs"
          : "bg-neutral-900 text-white border-neutral-800 shadow-md"
      }`}
    >
      <div class="flex items-center justify-between gap-2 mb-2.5">
        <span
          class={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
            props.isDataDocks
              ? "bg-[#fd4f00]/10 text-[#fd4f00] border-[#fd4f00]/20"
              : "bg-neutral-800 text-neutral-300 border-neutral-700"
          }`}
        >
          Next Steps
        </span>
      </div>

      <h4
        class={`text-base sm:text-lg font-bold leading-tight mb-1.5 ${
          props.isDataDocks ? "text-neutral-900" : "text-white"
        }`}
      >
        {props.isDataDocks
          ? "Book a Live DataDocks Demo"
          : `Identify the Top 3 Systems for Your Operations`}
      </h4>

      <p
        class={`text-xs sm:text-sm leading-relaxed mb-4 ${
          props.isDataDocks ? "text-neutral-700" : "text-neutral-300"
        }`}
      >
        {props.isDataDocks
          ? `See how DataDocks streamlines loading dock appointments, reduces driver dwell times, and integrates seamlessly with your ${props.integrationEcosystem || "main yard management software"}.`
          : `Selecting the ideal software for your facility depends on your specific throughput, ERP ecosystem, and hardware requirements. We recommend booking demos with 3 relevant vendors to compare key capabilities and benchmark features directly against your operational requirements.`}
      </p>

      {/* ACTIONS */}
      <Show when={props.isDataDocks}>
        <div class="pt-1">
          <Show
            when={!isSubmitted()}
            fallback={
              <div class="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <svg class="size-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>Opening calendar...</span>
              </div>
            }
          >
            <form onSubmit={handleSubmit} class="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your work email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                required
                class="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border focus:outline-none focus:ring-2 bg-white text-neutral-900 border-neutral-300 focus:ring-[#fd4f00]"
              />
              <button
                type="submit"
                class="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap bg-[#fd4f00] hover:bg-[#e04600] text-white shadow-xs"
              >
                <span>Book a Demo</span>
                <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </form>
          </Show>
        </div>
      </Show>
    </div>
  );
}

/* ── Shared Icon ── */

function Chevron(props: { class?: string }) {
  return (
    <svg
      class={`size-4 shrink-0 transition-[transform,color] duration-300 ${props.class ?? ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2.5"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** Primary Category Card (Page 1) */
function CategoryCard(props: {
  id: string;
  src: string;
  alt: string;
  title: string;
  aspectRatio: string;
  onClick: (e: MouseEvent) => void;
  index: number;
  disabled?: boolean;
  isBackwardNav?: boolean;
  homeIndex?: number;
  isExitingCards?: boolean;
  isHomeLandingComplete?: boolean;
  flipSourceIndex?: number | null;
}) {
  const theme = () => PRIMARY_TINTS[props.id];
  const isHomeCard = () => props.isBackwardNav && props.index === (props.homeIndex ?? 0);
  const isFlippingCard = () => props.isExitingCards && props.flipSourceIndex !== undefined && props.flipSourceIndex !== null && props.index === props.flipSourceIndex;

  const delayStyle = (): JSX.CSSProperties => {
    if (isFlippingCard()) {
      return { opacity: "0", animation: "none", visibility: "hidden", "pointer-events": "none" };
    }
    if (props.isExitingCards) {
      return {
        "animation-delay": `${props.index * 35}ms`,
        "pointer-events": "none"
      };
    }
    if (props.isBackwardNav) {
      if (isHomeCard()) {
        return props.isHomeLandingComplete
          ? { opacity: "1", animation: "none", transition: "none" }
          : { opacity: "0", animation: "none", transition: "none" };
      }
      return { "animation-delay": `${props.index * 90}ms` };
    }
    return { "animation-delay": `${props.index * 90}ms` };
  };

  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      style={delayStyle()}
      data-home-card={isHomeCard() ? "true" : undefined}
      aria-label={`Select ${props.title} category`}
      class={`group relative rounded-xl overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fd4f00] focus-visible:ring-offset-2 transition-[box-shadow,transform] duration-200 ease-out hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none ${
        isFlippingCard()
          ? "!opacity-0 !animation-none invisible"
          : props.isExitingCards
          ? "yt-card-exit"
          : props.isBackwardNav && !isHomeCard()
          ? "yt-subcard-enter"
          : isHomeCard()
          ? ""
          : "yt-card-enter"
      }`}
    >
      <img
        src={props.src}
        alt={props.alt ?? props.title}
        width="508"
        height="276"
        class="w-full block rounded-xl scale-100"
        style={{ "aspect-ratio": props.aspectRatio }}
        loading="eager"
        decoding="async"
      />
      
      {theme() && (
        <div
          class={`absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none z-10 ${theme()!.opacityClass}`}
          style={{ "background-color": theme()!.overlayHex }}
        />
      )}

      <div class="absolute inset-x-0 bottom-0 px-4 pt-14 pb-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-between pointer-events-none z-20">
        <span class="text-xs sm:text-sm font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] leading-snug">
          {props.title}
        </span>
        <Chevron class="text-white/80 group-hover:text-white group-hover:translate-x-1.5 ml-2" />
      </div>
    </button>
  );
}

/** Sub-category Card (Page 2) */
function SubCard(props: {
  id: string;
  src?: string;
  alt?: string;
  title: string;
  aspectRatio?: string;
  imgClass?: string;
  onClick: (e: MouseEvent) => void;
  index: number;
  disabled?: boolean;
  isBackwardNav?: boolean;
  homeIndex?: number;
  isExitingCards?: boolean;
  isHomeLandingComplete?: boolean;
  flipSourceIndex?: number | null;
}) {
  const theme = () => SUBCATEGORY_TINTS[props.id];
  const isHomeCard = () => props.isBackwardNav && props.index === (props.homeIndex ?? 0);
  const isFlippingCard = () => props.isExitingCards && props.flipSourceIndex !== undefined && props.flipSourceIndex !== null && props.index === props.flipSourceIndex;

  const delayStyle = (): JSX.CSSProperties => {
    if (isFlippingCard()) {
      return { opacity: "0", animation: "none", visibility: "hidden", "pointer-events": "none" };
    }
    if (props.isExitingCards) {
      return {
        "animation-delay": `${props.index * 35}ms`,
        "pointer-events": "none"
      };
    }
    if (props.isBackwardNav) {
      if (isHomeCard()) {
        return props.isHomeLandingComplete
          ? { opacity: "1", animation: "none", transition: "none" }
          : { opacity: "0", animation: "none", transition: "none" };
      }
      return { "animation-delay": `${props.index * 90}ms` };
    }
    return { "animation-delay": `${props.index * 90}ms` };
  };

  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      style={delayStyle()}
      data-home-card={isHomeCard() ? "true" : undefined}
      aria-label={`Select ${props.title} sub-category`}
      class={`group relative rounded-xl overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fd4f00] focus-visible:ring-offset-2 transition-[box-shadow,transform] duration-200 ease-out hover:shadow-md active:scale-[0.98] disabled:pointer-events-none ${
        isFlippingCard()
          ? "!opacity-0 !animation-none invisible"
          : props.isExitingCards
          ? "yt-card-exit"
          : props.isBackwardNav && !isHomeCard()
          ? "yt-subcard-enter"
          : isHomeCard()
          ? ""
          : "yt-subcard-enter"
      }`}
    >
      <img
        src={props.src}
        alt={props.alt ?? props.title}
        width="508"
        height="276"
        class={`w-full block rounded-xl scale-100 object-cover ${props.imgClass ?? ""}`}
        style={props.aspectRatio ? { "aspect-ratio": props.aspectRatio } : {}}
        loading="lazy"
        decoding="async"
      />

      {theme() && (
        <div
          class={`absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none z-10 ${theme()!.opacityClass}`}
          style={{ "background-color": theme()!.overlayHex }}
        />
      )}

      <div class="absolute inset-x-0 bottom-0 px-4 pt-14 pb-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-between pointer-events-none z-20">
        <span class="text-xs sm:text-sm font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] leading-snug">
          {props.title}
        </span>
        <Chevron class="text-white/80 group-hover:text-white group-hover:translate-x-1.5 ml-2" />
      </div>
    </button>
  );
}

/** Text-only list item for subcategories without images */
function TextListItem(props: {
  sub: SubCategory;
  onClick: () => void;
  index: number;
  disabled?: boolean;
  isBackwardNav?: boolean;
  homeIndex?: number;
  isExitingCards?: boolean;
  isHomeLandingComplete?: boolean;
  flipSourceIndex?: number | null;
}) {
  const isHomeCard = () => props.isBackwardNav && props.index === (props.homeIndex ?? 0);
  const isFlippingCard = () => props.isExitingCards && props.flipSourceIndex !== undefined && props.flipSourceIndex !== null && props.index === props.flipSourceIndex;

  const delayStyle = (): JSX.CSSProperties => {
    if (isFlippingCard()) {
      return { opacity: "0", animation: "none", visibility: "hidden", "pointer-events": "none" };
    }
    if (props.isExitingCards) {
      return {
        "animation-delay": `${props.index * 35}ms`,
        "pointer-events": "none"
      };
    }
    if (props.isBackwardNav) {
      if (isHomeCard()) {
        return props.isHomeLandingComplete
          ? { opacity: "1", animation: "none", transition: "none" }
          : { opacity: "0", animation: "none", transition: "none" };
      }
      return { "animation-delay": `${props.index * 90}ms` };
    }
    return { "animation-delay": `${props.index * 90}ms` };
  };

  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      style={delayStyle()}
      data-home-card={isHomeCard() ? "true" : undefined}
      aria-label={`Select ${props.sub.title}`}
      class={`w-full text-left py-3.5 border-b border-[#ece6de] flex items-center justify-between group hover:bg-neutral-50/80 active:bg-neutral-100 transition-[background-color] duration-200 ease-out disabled:pointer-events-none ${
        isFlippingCard()
          ? "!opacity-0 !animation-none invisible"
          : props.isExitingCards
          ? "yt-card-exit"
          : props.isBackwardNav && !isHomeCard()
          ? "yt-subcard-enter"
          : "yt-subcard-enter"
      }`}
    >
      <div class="min-w-0 pr-4">
        <span class="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-[#fd4f00] transition-colors block">
          {props.sub.title}
        </span>
        <span class="text-xs text-neutral-600 mt-0.5 leading-snug block">
          {props.sub.description}
        </span>
      </div>
      <Chevron class="text-neutral-300 group-hover:text-[#fd4f00] group-hover:translate-x-1.5" />
    </button>
  );
}

/* ── Main Component ── */

export default function YardTypeSelector() {
  const engine = createYardTypeEngine();

  // Navigation & animation signals
  const [isNavigating, setIsNavigating] = createSignal(false);
  const [isExitingCards, setIsExitingCards] = createSignal(false);
  const [flipSourceIndex, setFlipSourceIndex] = createSignal<number | null>(null);
  const [isHeaderExiting, setIsHeaderExiting] = createSignal(false);
  const [isHeaderEntering, setIsHeaderEntering] = createSignal(false);
  const [isHomeLandingComplete, setIsHomeLandingComplete] = createSignal(false);

  // Dual-Container Text Cross-Fade Signals (Old & New text stacked)
  const [oldHeaderState, setOldHeaderState] = createSignal<{
    title: string;
    subtitle: string;
    badge: string;
    showBack: boolean;
    backLabel: string;
  } | null>(null);

  const [headerTitle, setHeaderTitle] = createSignal<string>("What Do You Manage In Your Yard?");
  const [headerSubtitle, setHeaderSubtitle] = createSignal<string>("Select your facility to explore the systems relevant to your operations");
  const [headerBadge, setHeaderBadge] = createSignal<string>("YMS Requirements Explorer");
  const [showBackButton, setShowBackButton] = createSignal<boolean>(false);
  const [backButtonLabel, setBackButtonLabel] = createSignal<string>("");

  // Selected system index for Screen 3 Master-Detail view
  const [selectedSystemIndex, setSelectedSystemIndex] = createSignal<number>(0);

  // Always-Present Header Thumbnail Signals
  const [headerThumbSrc, setHeaderThumbSrc] = createSignal<string | null>(null);
  const [headerThumbAlt, setHeaderThumbAlt] = createSignal<string>("");
  const [headerThumbAspect, setHeaderThumbAspect] = createSignal<string | null>(null);
  const [isHeaderThumbBoxTransparent, setIsHeaderThumbBoxTransparent] = createSignal<boolean>(false);

  // Shared element FLIP tracking
  let originRect: DOMRect | null = null;
  let originSrc: string | null = null;
  let originNode: HTMLElement | null = null;
  const [targetHomeIndex, setTargetHomeIndex] = createSignal<number>(0);

  // Global Active Animation Safety State
  let activeClone: HTMLElement | null = null;
  let activeAnim: Animation | null = null;
  let activeTargetEl: HTMLElement | null = null;

  const cleanupActiveAnimation = () => {
    if (activeAnim) {
      try { activeAnim.cancel(); } catch (_) {}
      activeAnim = null;
    }
    if (activeTargetEl) {
      activeTargetEl.style.opacity = "1";
      activeTargetEl.style.transition = "";
      activeTargetEl = null;
    }
    if (activeClone) {
      if (activeClone.parentNode) {
        activeClone.parentNode.removeChild(activeClone);
      }
      activeClone = null;
    }
  };

  onCleanup(() => {
    cleanupActiveAnimation();
    setIsHeaderThumbBoxTransparent(false);
  });

  // Screen reader status announcement memo
  const screenAnnouncement = createMemo(() => {
    const sub = engine.selectedSubCategory();
    const cat = engine.selectedCategory();
    if (sub) {
      return `Viewing solution details for ${sub.title}. Recommended architecture: ${sub.ymsFit}.`;
    }
    if (cat) {
      return `Viewing ${cat.subCategories.length} sub-categories for ${cat.title}.`;
    }
    return `Viewing 4 primary facility types for yard type selector.`;
  });

  // Prefetch subcategory images on hover intent
  const prefetchedSets = new Set<string>();
  const prefetchImages = (catId: string) => {
    if (prefetchedSets.has(catId)) return;
    prefetchedSets.add(catId);
    const cat = engine.allCategories.find((c) => c.id === catId);
    cat?.subCategories.forEach((s) => {
      if (s.imageSrc) {
        const img = new Image();
        img.src = s.imageSrc;
      }
    });
  };

  // Ref for focus management after screen transitions
  let focusTargetRef: HTMLElement | null = null;

  const lockNavigation = (customLockMs = 680) => {
    cleanupActiveAnimation();
    setIsNavigating(true);
    setTimeout(() => {
      setIsNavigating(false);
      setIsExitingCards(false);
      setFlipSourceIndex(null);
      setIsHeaderExiting(false);
      setIsHeaderEntering(false);
      setOldHeaderState(null);
      // Move keyboard focus to new screen content after transition
      requestAnimationFrame(() => {
        if (focusTargetRef) {
          focusTargetRef.focus({ preventScroll: true });
          focusTargetRef = null;
        }
      });
    }, customLockMs);
  };

  /**
   * FORWARD NAVIGATION PIPELINE (Interleaved Stagger + Smooth Reflow Header)
   */
  const executeForwardPipeline = (
    navigateEngineFn: () => void,
    clickedCardIdx: number,
    totalCards: number,
    nextBadge: string,
    nextTitle: string,
    nextSubtitle: string,
    nextShowBack: boolean,
    nextBackLabel: string,
    nextThumbSrc: string | null,
    nextThumbAlt: string,
    nextThumbAspect: string | null
  ) => {
    const isFromHome = engine.selectedCategoryId() === null;

    // 1. Snapshot current header text for dual-container cross-fade
    setOldHeaderState({
      title: headerTitle(),
      subtitle: headerSubtitle(),
      badge: headerBadge(),
      showBack: showBackButton(),
      backLabel: backButtonLabel()
    });

    // 2. Start stagger exit on current cards, hiding clicked card slot for FLIP
    setFlipSourceIndex(clickedCardIdx);
    setIsExitingCards(true);

    // 3. Hide header thumbnail box during flight (prevents duplicate image & grey box)
    setIsHeaderThumbBoxTransparent(true);

    setHeaderBadge(nextBadge);
    setHeaderTitle(nextTitle);
    setHeaderSubtitle(nextSubtitle);
    setShowBackButton(nextShowBack);
    setBackButtonLabel(nextBackLabel);
    setHeaderThumbAspect(nextThumbAspect);
    setHeaderThumbAlt(nextThumbAlt);

    // Pre-assign target image src so browser decodes it during flight while hidden
    if (nextThumbSrc) {
      setHeaderThumbSrc(nextThumbSrc);
    }

    // Trigger dual-container text cross-fade
    setIsHeaderExiting(true);
    setIsHeaderEntering(true);

    // Lock navigation through full pipeline
    lockNavigation(680);

    // 4. Wait one RAF for layout reflow, then measure target thumbnail box & launch FLIP
    requestAnimationFrame(() => {
      const headerThumbBox = document.querySelector<HTMLElement>("[data-yt-header-thumb-box]");
      if (headerThumbBox && originRect && originSrc) {
        animateForwardSharedElement(headerThumbBox, nextThumbSrc);
      } else {
        setHeaderThumbSrc(nextThumbSrc);
        setIsHeaderThumbBoxTransparent(false);
      }
    });

    // 5. Interleaved state transition: switch engine when all non-clicked cards finish exiting
    // Exit animation duration is 160ms. Stagger spacing is 35ms per card.
    const maxExitDelay = Math.max(160, (totalCards - 1) * 35 + 160);
    setTimeout(() => {
      setIsExitingCards(false);
      setFlipSourceIndex(null);
      navigateEngineFn();
    }, maxExitDelay);
  };

  const handleCategoryClick = (catId: string, e: MouseEvent) => {
    if (isNavigating()) return;
    
    const targetBtn = e.currentTarget as HTMLElement;
    originNode = targetBtn;
    const imgEl = targetBtn.querySelector("img");
    if (imgEl) {
      originRect = targetBtn.getBoundingClientRect();
      originSrc = imgEl.src;
    }

    const cat = engine.allCategories.find((c) => c.id === catId);
    const catIdx = engine.allCategories.findIndex((c) => c.id === catId);
    if (cat) {
      executeForwardPipeline(
        () => engine.selectCategory(catId),
        catIdx >= 0 ? catIdx : 0,
        engine.allCategories.length,
        cat.title,
        "Select your facility sub-type",
        "Choose the card that best describes your operations below",
        true,
        "ALL CATEGORIES",
        cat.imageSrc,
        cat.imageAlt,
        "508 / 276"
      );
    }
  };

  const handleSubCategoryClick = (subId: string, e: MouseEvent) => {
    if (isNavigating()) return;
    
    const targetBtn = e.currentTarget as HTMLElement;
    originNode = targetBtn;
    const imgEl = targetBtn.querySelector("img");
    if (imgEl) {
      originRect = targetBtn.getBoundingClientRect();
      originSrc = imgEl.src;
    }

    const cat = engine.selectedCategory();
    const sub = cat?.subCategories.find((s) => s.id === subId);
    const subIdx = cat ? cat.subCategories.findIndex((s) => s.id === subId) : 0;
    if (sub && cat) {
      setSelectedSystemIndex(0);
      const hasSomeImages = cat.subCategories.some((s) => !!s.imageSrc);
      const is3Col = hasSomeImages && (cat.subCategories.length === 3 || cat.subCategories.length === 6);
      const isTop2 = subIdx < 2;
      const subAspect = getSubCardAspectRatio(is3Col, isTop2, cat.subCategories.length);

      executeForwardPipeline(
        () => engine.selectSubCategory(subId),
        subIdx >= 0 ? subIdx : 0,
        cat.subCategories.length,
        sub.title,
        sub.title,
        sub.description,
        true,
        cat.title.toUpperCase(),
        sub.imageSrc ?? cat.imageSrc,
        sub.imageAlt ?? cat.imageAlt,
        subAspect
      );
    }
  };

  /**
   * REVERSE BACK PIPELINE
   */
  const executeBackPipeline = (
    homeIdx: number,
    navigateEngineFn: () => void,
    totalCards: number,
    nextHeaderBadge: string,
    nextHeaderTitle: string,
    nextHeaderSubtitle: string,
    nextShowBack: boolean,
    nextBackLabel: string,
    nextThumbSrc: string | null,
    nextThumbAlt: string,
    nextThumbAspect: string | null
  ) => {
    if (isNavigating()) return;

    const isGoingToHome = nextThumbSrc === null;

    // Capture header thumbnail BEFORE transition
    const headerThumb = document.querySelector<HTMLImageElement>("[data-yt-header-thumb]");
    if (headerThumb && headerThumb.src) {
      originRect = headerThumb.getBoundingClientRect();
      originSrc = headerThumb.src;
    }

    setTargetHomeIndex(homeIdx);
    setIsHomeLandingComplete(false);
    
    // Snapshot current header text for dual-container cross-fade
    setOldHeaderState({
      title: headerTitle(),
      subtitle: headerSubtitle(),
      badge: headerBadge(),
      showBack: showBackButton(),
      backLabel: backButtonLabel()
    });

    // Start stagger exit
    setIsExitingCards(true);

    // Hide header thumbnail box during flight (prevents grey box & image duplicate)
    setIsHeaderThumbBoxTransparent(true);

    setHeaderBadge(nextHeaderBadge);
    setHeaderTitle(nextHeaderTitle);
    setHeaderSubtitle(nextHeaderSubtitle);
    setShowBackButton(nextShowBack);
    setBackButtonLabel(nextBackLabel);
    setHeaderThumbAspect(nextThumbAspect);
    setHeaderThumbAlt(nextThumbAlt);

    // Trigger dual-container text cross-fade
    setIsHeaderExiting(true);
    setIsHeaderEntering(true);

    lockNavigation(720);

    // Synchronously switch engine so target grid card mounts in DOM
    setIsExitingCards(false);
    navigateEngineFn();

    // Trigger Reverse FLIP immediately without delay
    requestAnimationFrame(() => {
      triggerReverseFLIP(nextThumbSrc);
    });
  };

  const handleBackToCategories = () => {
    const catId = engine.selectedCategoryId();
    const catIdx = engine.allCategories.findIndex((c) => c.id === catId);
    const homeIdx = catIdx >= 0 ? catIdx : 0;
    const cat = engine.selectedCategory();
    const totalCards = cat ? cat.subCategories.length : engine.allCategories.length;

    executeBackPipeline(
      homeIdx,
      () => engine.goBackToCategories(),
      totalCards,
      "YMS Requirements Explorer",
      "What Do You Manage In Your Yard?",
      "Select your facility to explore the systems relevant to your operations",
      false,
      "",
      null,
      "",
      null
    );
  };

  const handleBackToSubCategories = () => {
    const subId = engine.selectedSubCatId();
    const cat = engine.selectedCategory();
    const subIdx = cat ? cat.subCategories.findIndex((s) => s.id === subId) : 0;
    const homeIdx = subIdx >= 0 ? subIdx : 0;
    const catTitle = cat ? cat.title : "";
    executeBackPipeline(
      homeIdx,
      () => engine.goBackToSubCategories(),
      1,
      catTitle,
      "Select your facility sub-type",
      "Choose the card that best describes your operations below",
      true,
      "ALL CATEGORIES",
      cat ? cat.imageSrc : null,
      cat ? cat.imageAlt : "",
      "508 / 276"
    );
  };

  /** Trigger Reverse FLIP Morph (480ms, Smooth Easing, Guarded against Text-Only cards) */
  const triggerReverseFLIP = (nextThumbSrc: string | null) => {
    const homeCardEl = document.querySelector<HTMLElement>("[data-home-card='true']");
    if (!homeCardEl) {
      setHeaderThumbSrc(nextThumbSrc);
      setIsHomeLandingComplete(true);
      return;
    }

      // Check if home card contains an <img>. If not (text-only card), skip image FLIP!
      const homeImg = homeCardEl.querySelector("img");
      if (!homeImg || !originRect) {
        setHeaderThumbSrc(nextThumbSrc);
        setIsHomeLandingComplete(true);
        return;
      }

      const first = originRect;
      originRect = null;

      const last = homeCardEl.getBoundingClientRect();
      if (!last.width || !last.height) {
        setHeaderThumbSrc(nextThumbSrc);
        setIsHomeLandingComplete(true);
        return;
      }

      cleanupActiveAnimation();

      // Hide header thumbnail box during reverse flight
      setIsHeaderThumbBoxTransparent(true);

      // Keep target home card slot invisible while clone flies
      homeCardEl.style.transition = "none";
      homeCardEl.style.opacity = "0";

      // Full DOM Clone
      const clone = homeCardEl.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-home-card");
      clone.classList.remove("invisible", "!opacity-0", "!animation-none", "yt-card-exit");
      clone.style.position = "fixed";
      clone.style.left = `${first.left}px`;
      clone.style.top = `${first.top}px`;
      clone.style.width = `${first.width}px`;
      clone.style.height = `${first.height}px`;
      clone.style.margin = "0";
      clone.style.zIndex = "99999";
      clone.style.pointerEvents = "none";
      clone.style.opacity = "1";
      clone.style.visibility = "visible";
      clone.style.animation = "none";
      clone.style.transition = "none";

      // Ensure the clone's image shows the exact image from the header!
      const imgInside = clone.querySelector("img");
      if (imgInside) {
        if (originSrc) imgInside.src = originSrc;
        imgInside.style.height = "100%";
        imgInside.style.objectFit = "cover";
      }

      // Keep the label overlay visible throughout the flight — the text
      // scales naturally with the clone from thumbnail size to card size.
      // No need to hide/fade it.

      document.body.appendChild(clone);
      activeClone = clone;

      // Relaxed 480ms FLIP morph with smooth cubic-bezier curve
      const anim = clone.animate(
        [
          {
            left: `${first.left}px`,
            top: `${first.top}px`,
            width: `${first.width}px`,
            height: `${first.height}px`,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          },
          {
            left: `${last.left}px`,
            top: `${last.top}px`,
            width: `${last.width}px`,
            height: `${last.height}px`,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
          }
        ],
        {
          duration: 480,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards"
        }
      );

      activeAnim = anim;

      const finalize = () => {
        // Reveal real home card — label is already rendered
        homeCardEl.style.opacity = "1";
        homeCardEl.style.visibility = "visible";
        homeCardEl.style.transition = "none";

        setIsHomeLandingComplete(true);

        if (nextThumbSrc) {
          setHeaderThumbSrc(nextThumbSrc);
          setIsHeaderThumbBoxTransparent(false);
        } else {
          setHeaderThumbSrc(null);
          setIsHeaderThumbBoxTransparent(false);
        }

        activeTargetEl = null;

        const cloneToRemove = activeClone;
        activeClone = null;
        activeAnim = null;

        // Remove clone after real card is painted
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cloneToRemove && cloneToRemove.parentNode) {
              cloneToRemove.parentNode.removeChild(cloneToRemove);
            }
          });
        });
      };

      anim.onfinish = finalize;
      anim.oncancel = finalize;
  };

  /** Forward Shared Element Transformation */
  const animateForwardSharedElement = (
    targetThumbBox: HTMLElement,
    nextThumbSrc: string | null
  ) => {
    if (!originRect || !originSrc || !originNode) {
      setHeaderThumbSrc(nextThumbSrc);
      setIsHeaderThumbBoxTransparent(false);
      return;
    }
    const first = originRect;
    const src = originSrc;
    const node = originNode as HTMLElement;
    originRect = null;
    originSrc = null;
    originNode = null;

    cleanupActiveAnimation();

    // Measure target header thumbnail box layout destination
    const headerBoxRect = targetThumbBox.getBoundingClientRect();
    const aspectStr = headerThumbAspect();
    let targetWidthPx = 140; // Default fallback width
    if (aspectStr) {
      const parts = aspectStr.split("/").map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] > 0) {
        targetWidthPx = Math.round(76 * (parts[0] / parts[1]));
      }
    }

    const last = {
      left: headerBoxRect.left,
      top: headerBoxRect.top,
      width: targetWidthPx,
      height: 76
    };

    // Hide header thumbnail box while clone flies
    setIsHeaderThumbBoxTransparent(true);

    // Create full DOM clone of clicked card
    const clone = node.cloneNode(true) as HTMLElement;
    clone.classList.remove("invisible", "!opacity-0", "!animation-none", "yt-card-exit", "yt-subcard-enter");
    clone.style.position = "fixed";
    clone.style.left = `${first.left}px`;
    clone.style.top = `${first.top}px`;
    clone.style.width = `${first.width}px`;
    clone.style.height = `${first.height}px`;
    clone.style.margin = "0";
    clone.style.zIndex = "99999";
    clone.style.pointerEvents = "none";
    clone.style.opacity = "1";
    clone.style.visibility = "visible";
    clone.style.animation = "none";
    clone.style.transition = "none";

    const imgInside = clone.querySelector("img");
    if (imgInside) {
      if (src) imgInside.src = src;
      imgInside.style.height = "100%";
      imgInside.style.width = "100%";
      imgInside.style.objectFit = "cover";
    }

    // Fade out text overlay during flight for clean transition into thumbnail
    const textOverlay = clone.querySelector<HTMLElement>(".absolute.inset-x-0.bottom-0");
    if (textOverlay) {
      textOverlay.style.transition = "opacity 300ms ease-out";
      requestAnimationFrame(() => {
        textOverlay.style.opacity = "0";
      });
    }

    document.body.appendChild(clone);
    activeClone = clone;

    // Smooth FLIP keyframes directly animating geometry
    const anim = clone.animate(
      [
        {
          left: `${first.left}px`,
          top: `${first.top}px`,
          width: `${first.width}px`,
          height: `${first.height}px`,
          borderRadius: "0.75rem",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
        },
        {
          left: `${last.left}px`,
          top: `${last.top}px`,
          width: `${last.width}px`,
          height: `${last.height}px`,
          borderRadius: "0.75rem",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        }
      ],
      {
        duration: 480,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards"
      }
    );

    activeAnim = anim;

    const finalize = () => {
      setIsHeaderThumbBoxTransparent(false);
      if (nextThumbSrc) {
        setHeaderThumbSrc(nextThumbSrc);
      }

      const cloneToRemove = activeClone;
      activeClone = null;
      activeAnim = null;
      activeTargetEl = null;

      requestAnimationFrame(() => {
        if (cloneToRemove && cloneToRemove.parentNode) {
          cloneToRemove.parentNode.removeChild(cloneToRemove);
        }
      });
    };

    anim.onfinish = finalize;
    anim.oncancel = finalize;
  };

  const currentThumbWidth = createMemo(() => computeHeaderThumbWidth(headerThumbAspect()));

  return (
    <div class="w-full max-w-7xl mx-auto px-4 md:px-12 pb-8 font-sans text-neutral-900 min-h-[64rem] sm:min-h-[54rem] flex flex-col justify-start">
      {/* Screen Reader Live Region */}
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        {screenAnnouncement()}
      </div>

      <style>{STYLES}</style>

      {/* ── UNIFIED PERSISTENT HEADER FRAME (Always Present, Width Reflow) ── */}
      <div class="mb-4 pb-3 border-b border-neutral-200/70 flex items-center min-h-[4.5rem] relative">
        {/* Always-Present Thumbnail Container with CSS Width Transition */}
        <div
          data-yt-header-thumb-box
          style={{
            width: currentThumbWidth(),
            opacity: isHeaderThumbBoxTransparent() ? "0" : (headerThumbAspect() ? "1" : "0"),
            visibility: isHeaderThumbBoxTransparent() ? "hidden" : "visible",
            "margin-right": headerThumbAspect() ? "1rem" : "0px",
            "border-width": headerThumbAspect() ? "1px" : "0px"
          }}
          class="shrink-0 h-[4.75rem] rounded-xl overflow-hidden border-neutral-200/90 shadow-xs bg-neutral-100 relative transition-[width,margin-right] duration-480 ease-[cubic-bezier(0.22,1,0.36,1)]"
        >
          {headerThumbSrc() && (
            <img
              data-yt-header-thumb
              src={headerThumbSrc()!}
              alt={headerThumbAlt()}
              width="508"
              height="276"
              class="w-full h-full object-cover block rounded-xl"
            />
          )}
        </div>

        {/* Dual-Container Text Column (Overlapped Cross-Fade) */}
        <div class="flex-grow min-w-0 relative min-h-[3.25rem] flex items-center">
          {/* Outgoing Text Container */}
          {oldHeaderState() && (
            <div class="absolute inset-x-0 top-0 pointer-events-none yt-header-exit">
              <div class="flex items-center gap-2 mb-1 h-6">
                {oldHeaderState()!.showBack && (
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 -ml-1 rounded-md text-[10px] font-bold tracking-widest text-neutral-700 uppercase bg-neutral-200/70">
                    {oldHeaderState()!.backLabel}
                  </span>
                )}
                <span class="text-[10px] font-bold tracking-widest text-[#fd4f00] uppercase bg-[#F8EDD9] px-2 py-0.5 rounded border border-[#E5D3B3] truncate max-w-[200px] sm:max-w-none">
                  {oldHeaderState()!.badge}
                </span>
              </div>
              <h2 class="text-base sm:text-lg font-bold text-black leading-snug">
                {oldHeaderState()!.title}
              </h2>
              <p class="text-xs text-neutral-600 mt-0.5">
                {oldHeaderState()!.subtitle}
              </p>
            </div>
          )}

          {/* Incoming Text Container */}
          <div class={`w-full ${isHeaderEntering() ? "yt-header-enter" : ""}`}>
            <div class="flex items-center gap-2 mb-1 h-6">
              {showBackButton() && (
                <button
                  type="button"
                  onClick={() => {
                    if (engine.selectedSubCategory()) {
                      handleBackToSubCategories();
                    } else {
                      handleBackToCategories();
                    }
                  }}
                  disabled={isNavigating()}
                  aria-label="Go back"
                  class="inline-flex items-center gap-1 px-2 py-0.5 -ml-1 rounded-md text-[10px] font-bold tracking-widest text-neutral-700 uppercase bg-neutral-200/70 hover:bg-neutral-300/80 hover:text-black active:scale-95 transition-[transform,background-color,color] duration-200 group disabled:pointer-events-none"
                >
                  <svg class="size-3 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  {backButtonLabel()}
                </button>
              )}
              <span class="text-[10px] font-bold tracking-widest text-[#fd4f00] uppercase bg-[#F8EDD9] px-2 py-0.5 rounded border border-[#E5D3B3] truncate max-w-[200px] sm:max-w-none">
                {headerBadge()}
              </span>
            </div>

            <h2 class="text-base sm:text-lg font-bold text-black leading-snug">
              {headerTitle()}
            </h2>
            <p class="text-xs text-neutral-600 mt-0.5">
              {headerSubtitle()}
            </p>
          </div>
        </div>
      </div>

      <Switch>
        {/* ── SCREEN 1: Primary Categories ── */}
        <Match when={engine.selectedCategoryId() === null}>
          <div class="w-full">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <For each={engine.allCategories}>
                {(cat, index) => (
                  <div
                    onPointerEnter={() => prefetchImages(cat.id)}
                    onFocusIn={() => prefetchImages(cat.id)}
                  >
                    <CategoryCard
                      id={cat.id}
                      src={cat.imageSrc}
                      alt={cat.imageAlt}
                      title={cat.title}
                      aspectRatio="508 / 276"
                      index={index()}
                      disabled={isNavigating()}
                      isBackwardNav={engine.navDirection() === "backward"}
                      homeIndex={targetHomeIndex()}
                      isExitingCards={isExitingCards()}
                      flipSourceIndex={flipSourceIndex()}
                      isHomeLandingComplete={isHomeLandingComplete()}
                      onClick={(e) => handleCategoryClick(cat.id, e)}
                    />
                  </div>
                )}
              </For>
            </div>
          </div>
        </Match>

        {/* ── SCREEN 2: Sub-categories ── */}
        <Match when={engine.selectedCategory() !== null && engine.selectedSubCategory() === null}>
          <div class="w-full">
            {(() => {
              const cat = engine.selectedCategory();
              if (!cat) return null;
              const hasSomeImages = cat.subCategories.some((s) => !!s.imageSrc);
              const is3Col = hasSomeImages && (cat.subCategories.length === 3 || cat.subCategories.length === 6);
              const is5Row = hasSomeImages && cat.subCategories.length === 5;
              const isBackward = () => engine.navDirection() === "backward";

              return (
                <>
                  {/* Sub-category Grid */}
                  {is3Col ? (
                    /* 3-column vertical cards (Heavy Industrial / 6-grid) */
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <For each={cat.subCategories}>
                        {(sub, index) => (
                          <SubCard
                            id={sub.id}
                            src={sub.imageSrc}
                            alt={sub.imageAlt}
                            title={sub.title}
                            aspectRatio={cat.subCategories.length === 3 ? "320 / 511" : "319 / 257"}
                            index={index()}
                            isBackwardNav={isBackward()}
                            homeIndex={targetHomeIndex()}
                            disabled={isNavigating()}
                            isExitingCards={isExitingCards()}
                            flipSourceIndex={flipSourceIndex()}
                            isHomeLandingComplete={isHomeLandingComplete()}
                            onClick={(e) => handleSubCategoryClick(sub.id, e)}
                          />
                        )}
                      </For>
                    </div>
                  ) : is5Row ? (
                    /* 2 top cards + 3 panoramic rows (Freight & Cargo) */
                    <div class="flex flex-col gap-2.5">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <For each={cat.subCategories.slice(0, 2)}>
                          {(sub, index) => (
                            <SubCard
                              id={sub.id}
                              src={sub.imageSrc}
                              alt={sub.imageAlt}
                              title={sub.title}
                              aspectRatio="508 / 224"
                              index={index()}
                              isBackwardNav={isBackward()}
                              homeIndex={targetHomeIndex()}
                              disabled={isNavigating()}
                              isExitingCards={isExitingCards()}
                              flipSourceIndex={flipSourceIndex()}
                              isHomeLandingComplete={isHomeLandingComplete()}
                              onClick={(e) => handleSubCategoryClick(sub.id, e)}
                            />
                          )}
                        </For>
                      </div>
                      <For each={cat.subCategories.slice(2)}>
                        {(sub, index) => {
                          const realIdx = index() + 2;
                          return (
                            <SubCard
                              id={sub.id}
                              src={sub.imageSrc}
                              alt={sub.imageAlt}
                              title={sub.title}
                              imgClass="object-cover aspect-[1024/250] sm:aspect-[1024/110]"
                              index={realIdx}
                              isBackwardNav={isBackward()}
                              homeIndex={targetHomeIndex()}
                              disabled={isNavigating()}
                              isExitingCards={isExitingCards()}
                              flipSourceIndex={flipSourceIndex()}
                              isHomeLandingComplete={isHomeLandingComplete()}
                              onClick={(e) => handleSubCategoryClick(sub.id, e)}
                            />
                          );
                        }}
                      </For>
                    </div>
                  ) : (
                    /* Text list fallback */
                    <div class="border-t border-[#ece6de]">
                      <For each={cat.subCategories}>
                        {(sub, index) => (
                          <TextListItem
                            sub={sub}
                            index={index()}
                            isBackwardNav={isBackward()}
                            homeIndex={targetHomeIndex()}
                            disabled={isNavigating()}
                            isExitingCards={isExitingCards()}
                            flipSourceIndex={flipSourceIndex()}
                            isHomeLandingComplete={isHomeLandingComplete()}
                            onClick={() => engine.selectSubCategory(sub.id)}
                          />
                        )}
                      </For>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </Match>

        {/* ── SCREEN 3: Profile Summary ── */}
        <Match when={engine.selectedSubCategory() !== null}>
          <div class="w-full">
            {(() => {
              const cat = engine.selectedCategory();
              const sub = engine.selectedSubCategory();
              if (!cat || !sub) return null;

              return (
                <div class={isExitingCards() ? "yt-card-exit" : ""}>
                  <div class="pt-1">
                    {sub.matches && sub.matches.length > 0 ? (
                      /* ── 2-COLUMN MASTER-DETAIL LAYOUT ── */
                      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                        {/* ── LEFT COLUMN: Bar Chart System Selector ── */}
                        <div class="lg:col-span-5 space-y-3">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-bold uppercase tracking-wider text-[#9c806d]" id="yt-match-list-label">
                              Category Match List
                            </span>
                            <span class="text-[10px] font-medium text-neutral-600">
                              Click system to view details
                            </span>
                          </div>

                          <div class="space-y-2" data-match-type="use-case-relevance" role="listbox" aria-labelledby="yt-match-list-label">
                            <For each={sub.matches ?? []}>
                              {(item, idx) => {
                                const isSelected = () => selectedSystemIndex() === idx();
                                const isDataDocks = item.name === "DataDocks";
                                const isDataDocksSelected = () => isSelected() && isDataDocks;

                                return (
                                  <button
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected()}
                                    onClick={() => setSelectedSystemIndex(idx())}
                                    ref={(el: HTMLElement) => { if (idx() === 0) focusTargetRef = el; }}
                                    class={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer block hover:scale-[1.01] hover:shadow-md ${
                                      isSelected()
                                        ? isDataDocks
                                          ? "bg-[#F8EDD9] border-[#fd4f00] shadow-md scale-[1.01]"
                                          : "bg-white border-neutral-900 shadow-md scale-[1.01]"
                                        : "bg-neutral-50/90 border-neutral-200/80 hover:border-neutral-400"
                                    }`}
                                    aria-label={`${item.name}: ${item.score}% operational category match`}
                                    data-score-type="category-fit-percentage"
                                  >
                                    <div class="flex items-center justify-between text-xs font-semibold text-neutral-900 mb-2">
                                      <span class="flex items-center gap-1.5 truncate pr-2">
                                        <span class={isDataDocksSelected() ? "font-bold text-[#fd4f00]" : "text-neutral-900"}>
                                          {item.name}
                                        </span>
                                      </span>
                                      <span class="flex items-center gap-1 shrink-0">
                                        <span class={`font-mono text-xs font-bold ${isDataDocksSelected() ? "text-[#fd4f00]" : "text-neutral-700"}`}>
                                          {item.score}% Match
                                        </span>
                                        <svg class={`size-3.5 transition-colors ${
                                          isSelected()
                                            ? isDataDocks
                                              ? "text-[#fd4f00]"
                                              : "text-neutral-900"
                                            : "text-neutral-400"
                                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                      </span>
                                    </div>

                                    <div class="h-2 w-full bg-neutral-200/70 rounded-full overflow-hidden">
                                      <div
                                        class={`h-full rounded-full transition-all duration-500 ease-out ${
                                          isDataDocksSelected()
                                            ? "bg-[#fd4f00]"
                                            : item.score >= 80
                                            ? "bg-neutral-800"
                                            : item.score >= 50
                                            ? "bg-neutral-600"
                                            : "bg-neutral-400"
                                        }`}
                                        style={{ width: `${item.score}%` }}
                                      />
                                    </div>
                                  </button>
                                );
                              }}
                            </For>
                          </div>
                        </div>

                        {/* ── RIGHT COLUMN: Selected System Detail Panel ── */}
                        <div class="lg:col-span-7 space-y-4">
                          {(() => {
                            const matches = sub.matches ?? [];
                            const activeItem = () => matches[selectedSystemIndex()] ?? matches[0];
                            const isDataDocks = () => activeItem()?.name === "DataDocks";
                            return (
                              <>
                                {/* System Details Card */}
                                <div class={`p-5 sm:p-6 rounded-2xl space-y-4 border transition-all duration-200 ${
                                  isDataDocks()
                                    ? "bg-[#F8EDD9]/40 border-[#E5D3B3] shadow-xs"
                                    : "bg-neutral-50/90 border-neutral-200/80 shadow-xs"
                                }`}>
                                  {/* Panel Header */}
                                  <div class="flex items-start justify-between gap-3 pb-3 border-b border-neutral-200/80">
                                    <div>
                                      <span class="text-[10px] font-bold tracking-widest text-[#9c806d] uppercase">
                                        System Details
                                      </span>
                                      <h3 class={`text-base sm:text-lg font-bold leading-tight mt-0.5 ${isDataDocks() ? "text-[#fd4f00]" : "text-neutral-900"}`}>
                                        {activeItem().name}
                                      </h3>
                                    </div>
                                    <span class={`shrink-0 text-xs font-bold font-mono px-2.5 py-1 rounded-full border ${
                                      isDataDocks()
                                        ? "bg-[#fd4f00] text-white border-[#fd4f00]"
                                        : "bg-neutral-900 text-white border-neutral-900"
                                    }`}>
                                      {activeItem().score}% Match
                                    </span>
                                  </div>

                                  {/* Who Is It For */}
                                  {activeItem().whoIsItFor && (
                                    <div>
                                      <span class="text-xs font-bold uppercase tracking-wider text-[#9c806d] block mb-1">
                                        Who is it for?
                                      </span>
                                      <p class="text-sm text-neutral-800 leading-relaxed font-medium">
                                        {activeItem().whoIsItFor}
                                      </p>
                                    </div>
                                  )}

                                  {/* Architecture & Capabilities (Side-by-Side 2-Column Grid) */}
                                  <div class="grid sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-200/70 text-xs">
                                    <div>
                                      <span class="font-bold text-[#9c806d] uppercase tracking-wider block mb-1">
                                        Software Architecture
                                      </span>
                                      <p class="font-bold text-neutral-900 leading-snug">
                                        {activeItem().architecture ?? sub.ymsFit}
                                      </p>
                                    </div>
                                    <div>
                                      <span class="font-bold text-[#9c806d] uppercase tracking-wider block mb-1">
                                        Key Capabilities
                                      </span>
                                      <p class="text-neutral-700 leading-relaxed">
                                        {activeItem().capabilities ?? sub.keyCapability}
                                      </p>
                                    </div>
                                  </div>

                                  <p class="text-[11px] text-neutral-500 pt-2 border-t border-neutral-200/60 italic">
                                    Note: Scores indicate category functional fit index, not a product review or quality rating.
                                  </p>
                                </div>

                                {/* Next Steps CTA Card */}
                                <NextStepsCard
                                  selectedSystemName={activeItem().name}
                                  isDataDocks={isDataDocks()}
                                  subCategoryTitle={sub.title}
                                  integrationEcosystem={sub.integrationEcosystem}
                                />
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      /* ── STANDARD SUMMARY FOR OTHER CATEGORIES ── */
                      <div class="grid sm:grid-cols-2 gap-4 pt-4">
                        <div>
                          <span class="text-xs font-bold uppercase tracking-wider text-[#9c806d]">
                            Recommended Architecture
                          </span>
                          <p class="text-sm font-bold text-neutral-900 mt-1">{sub.ymsFit}</p>
                        </div>
                        <div>
                          <span class="text-xs font-bold uppercase tracking-wider text-[#9c806d]">
                            Key Capability
                          </span>
                          <p class="text-sm text-neutral-800 mt-1 leading-relaxed">
                            {sub.keyCapability}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div class="pt-4 mt-4 border-t border-[#ece6de] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleBackToCategories}
                      disabled={isNavigating()}
                      class="text-xs font-semibold text-neutral-500 hover:text-black transition-colors disabled:pointer-events-none"
                    >
                      Start over
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </Match>
      </Switch>
    </div>
  );
}
