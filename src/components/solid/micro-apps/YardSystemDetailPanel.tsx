/** @jsxImportSource solid-js */
import { Show, createSignal } from "solid-js";
import type { SubCategory, SystemMatch } from "./YardTypeEngine";
import { bentoCall } from "@/lib/bento";
import { CALENDLY_BOOKING_URL, CALENDLY_BRAND_PARAMS } from "@/lib/calendly-config.mjs";

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
          ? "bg-gradient-to-br from-[#FFF8E9] via-[#F8EDD9]/60 to-[#FFF8E9] dark:from-neutral-900 dark:via-neutral-900/90 dark:to-neutral-900 border-[#fd4f00]/30 dark:border-[#fd4f00]/40 shadow-xs"
          : "bg-neutral-900 dark:bg-neutral-900 text-white border-neutral-800 dark:border-neutral-700 shadow-md"
      }`}
    >
      <div class="flex items-center justify-between gap-2 mb-2.5">
        <span
          class={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
            props.isDataDocks
              ? "bg-[#fd4f00]/10 text-[#fd4f00] dark:text-[#ff7635] border-[#fd4f00]/20 dark:border-[#fd4f00]/30"
              : "bg-neutral-800 text-neutral-300 border-neutral-700"
          }`}
        >
          Next Steps
        </span>
      </div>

      <h4
        class={`text-base sm:text-lg font-bold leading-tight mb-1.5 ${
          props.isDataDocks ? "text-neutral-950 dark:text-white" : "text-white"
        }`}
      >
        {props.isDataDocks
          ? "Book a Live DataDocks Demo"
          : `Identify the Top 3 Systems for Your Operations`}
      </h4>

      <p
        class={`text-xs sm:text-sm leading-relaxed mb-4 ${
          props.isDataDocks ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-300"
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
              <div class="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                <svg class="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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
                class="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border focus:outline-none focus:ring-2 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:ring-[#fd4f00] placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
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

/** System Detail Card & Next Steps CTA (Screen 3) */
export default function SystemDetailPanel(props: {
  item: SystemMatch;
  sub: SubCategory;
  isDataDocks: boolean;
}) {
  return (
    <div class="space-y-4">
      {/* System Details Card */}
      <div
        class={`p-5 sm:p-6 rounded-2xl space-y-4 border transition-all duration-200 ${
          props.isDataDocks
            ? "bg-[#F8EDD9]/40 dark:bg-neutral-900 border-[#E5D3B3] dark:border-[#fd4f00]/40 shadow-xs"
            : "bg-neutral-50/90 dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 shadow-xs"
        }`}
      >
        {/* Panel Header */}
        <div class="flex items-start justify-between gap-3 pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
          <div>
            <span class="text-[10px] font-bold tracking-widest text-[#9c806d] dark:text-[#d4a276] uppercase">
              System Details
            </span>
            <h3
              class={`text-base sm:text-lg font-bold leading-tight mt-0.5 ${
                props.isDataDocks ? "text-[#fd4f00] dark:text-[#ff7635]" : "text-neutral-950 dark:text-white"
              }`}
            >
              {props.item.name}
            </h3>
          </div>
          <span
            class={`shrink-0 text-xs font-bold font-mono px-2.5 py-1 rounded-full border ${
              props.isDataDocks
                ? "bg-[#fd4f00] text-white border-[#fd4f00]"
                : "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
            }`}
          >
            {props.item.score}% Match
          </span>
        </div>

        {/* Who Is It For */}
        {/* Who Is It For */}
        <Show when={props.item.whoIsItFor}>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-[#9c806d] dark:text-[#d4a276] block mb-1">
              Who is it for?
            </span>
            <p class="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
              {props.item.whoIsItFor}
            </p>
          </div>
        </Show>

        {/* Architecture & Capabilities (Side-by-Side 2-Column Grid) */}
        <div class="grid sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-200/70 dark:border-neutral-800 text-xs">
          <div>
            <span class="font-bold text-[#9c806d] dark:text-[#d4a276] uppercase tracking-wider block mb-1">
              Software Architecture
            </span>
            <p class="font-bold text-neutral-950 dark:text-white leading-snug">
              {props.item.architecture ?? props.sub.ymsFit}
            </p>
          </div>
          <div>
            <span class="font-bold text-[#9c806d] dark:text-[#d4a276] uppercase tracking-wider block mb-1">
              Key Capabilities
            </span>
            <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {props.item.capabilities ?? props.sub.keyCapability}
            </p>
          </div>
        </div>

        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-200/60 dark:border-neutral-800 italic">
          Note: Scores indicate category functional fit index, not a product review or quality rating.
        </p>
      </div>

      {/* Next Steps CTA Card */}
      <NextStepsCard
        selectedSystemName={props.item.name}
        isDataDocks={props.isDataDocks}
        subCategoryTitle={props.sub.title}
        integrationEcosystem={props.sub.integrationEcosystem}
      />
    </div>
  );
}
