/** @jsxImportSource solid-js */
import { For } from "solid-js";
import { createYardTypeEngine } from "./YardTypeEngine";
import { cn } from "@/components/solid/lib/utils";

export default function YardTypeSelector() {
  const engine = createYardTypeEngine();

  return (
    <div class="my-6 text-neutral-900 font-sans">
      {/* SCREEN 1: Clean 2x2 Grid (No outer box nesting) */}
      <div
        class={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 transition-all duration-200",
          engine.selectedYardId() !== null && "hidden"
        )}
        role="radiogroup"
        aria-label="Yard Operation Models"
      >
        <For each={engine.allYardTypes}>
          {(yard) => (
            <button
              type="button"
              role="radio"
              aria-checked={engine.selectedYardId() === yard.id}
              onClick={() => engine.setSelectedYardId(yard.id)}
              class="group text-left rounded-xl border border-neutral-200/90 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-neutral-900 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              {/* Full Width Image (Aspect 508:276, Zero Letterboxing) */}
              <div class="w-full aspect-[508/276] overflow-hidden bg-neutral-100 relative">
                <img
                  src={yard.imageSrc}
                  alt={yard.imageAlt}
                  class="w-full h-full object-cover block transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>

              {/* Seamless Label Footer */}
              <div class="px-3.5 py-2.5 flex items-center justify-between border-t border-neutral-100 bg-[#faf8f5] group-hover:bg-neutral-50 transition-colors">
                <span class="text-xs font-semibold text-neutral-900 group-hover:text-black">
                  {yard.title}
                </span>
                <div class="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-900 transition-colors">
                  <svg
                    class="size-3.5 group-hover:translate-x-0.5 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          )}
        </For>
      </div>

      {/* SCREEN 2: Transitioned Active State View */}
      <For each={engine.allYardTypes}>
        {(yard) => (
          <div
            class={cn(
              "rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm transition-all duration-200",
              engine.selectedYardId() !== yard.id && "hidden"
            )}
          >
            {/* Top Bar Navigation */}
            <div class="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 bg-[#faf8f5]">
              <button
                type="button"
                onClick={() => engine.setSelectedYardId(null)}
                class="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to model selection
              </button>
              <span class="text-[11px] font-mono text-neutral-400">Selected Model</span>
            </div>

            {/* Selected Content */}
            <div class="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Image Column */}
              <div class="md:col-span-5 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 aspect-[508/276]">
                <img
                  src={yard.imageSrc}
                  alt={yard.imageAlt}
                  class="w-full h-full object-cover block"
                />
              </div>

              {/* Details Column */}
              <div class="md:col-span-7 space-y-3">
                <div>
                  <h3 class="text-sm font-bold text-neutral-900">{yard.title}</h3>
                  <p class="text-xs text-neutral-600 mt-1 leading-relaxed">
                    {yard.details.description}
                  </p>
                </div>

                <div class="pt-2 border-t border-neutral-100">
                  <div class="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Target Metrics & Capabilities
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <For each={yard.details.keyMetrics}>
                      {(metric) => (
                        <span class="px-2.5 py-1 rounded bg-[#faf8f5] text-neutral-800 text-[11px] font-medium border border-neutral-200">
                          {metric}
                        </span>
                      )}
                    </For>
                  </div>
                </div>

                <div class="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <span class="text-xs font-medium text-neutral-700">
                    {yard.details.recommendedType}
                  </span>
                  <button
                    type="button"
                    onClick={() => engine.setSelectedYardId(null)}
                    class="px-2.5 py-1 rounded border border-neutral-200 bg-[#faf8f5] text-xs font-medium text-neutral-700 hover:border-neutral-900 transition-colors"
                  >
                    Change selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
