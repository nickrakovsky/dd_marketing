/** @jsxImportSource solid-js */
import { createSignal, createMemo, For, Show } from "solid-js";
import type { Component } from "solid-js";
import { cn } from "@/components/solid/lib/utils";
import {
  comparisonCompetitors,
  comparisonFeatureGroups,
  datadocksFeatures,
} from "@/data/pages/comparison";
import type {
  ComparisonCompetitor,
  ComparisonFeature,
  ComparisonFeatureGroup,
  FeatureDetail,
} from "@/data/pages/comparison";

// ─── Support Cell ────────────────────────────────────────────────────────

const SupportCell: Component<{ detail: FeatureDetail | null | undefined; isDataDocks?: boolean }> = (props) => {
  const isStandout = () => props.detail?.level === "standout";

  const textClasses = () => {
    if (!props.detail) return "";
    if (isStandout()) return props.isDataDocks ? "text-transparent bg-clip-text bg-gradient-to-r from-[#fd4f00] via-[#ffaa00] to-[#fd4f00] bg-[length:200%_auto] font-bold" : "text-transparent bg-clip-text bg-gradient-to-r from-[#4a8136] via-[#6bbf4e] to-[#4a8136] bg-[length:200%_auto] font-bold";
    if (props.detail.level === "full") return "text-[#4a8136]";
    if (props.detail.level === "partial") return "text-[#eab308]"; // yellow
    return "text-[#9c806d]"; // mid-tier brown for none
  };

  const iconColorClasses = () => {
    if (!props.detail) return "";
    if (props.detail.level === "full") return "border border-[#4a8136] bg-transparent text-[#4a8136]";
    if (props.detail.level === "partial") return "border border-[#eab308] bg-transparent text-[#eab308]";
    return "border border-[#9c806d] bg-transparent text-[#9c806d]";
  };

  return (
    <div class="h-full w-full flex items-center justify-center p-2 rounded-lg transition-all duration-300">
      <Show when={props.detail}>
        <div class="flex items-center gap-2 max-w-full text-center relative z-10 font-sans">
          
          {/* Standout (Star) */}
          <Show when={isStandout()}>
            <div class={cn("relative shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-300 group-hover/row:scale-110", 
              props.isDataDocks ? "border border-[#fd4f00] bg-transparent text-[#fd4f00]" : "border border-[#4a8136] bg-transparent text-[#4a8136]"
            )}>
              <svg class="w-3.5 h-3.5 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
          </Show>

          {/* Full (Tick) */}
          <Show when={props.detail?.level === "full" && !isStandout()}>
            <div class={cn("shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-300", iconColorClasses())}>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
          </Show>
          
          {/* Partial (Dash) */}
          <Show when={props.detail?.level === "partial"}>
            <div class={cn("shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-300", iconColorClasses())}>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>
            </div>
          </Show>
          
          {/* None (Cross) */}
          <Show when={props.detail?.level === "none"}>
            <div class={cn("shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-300", iconColorClasses())}>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
          </Show>
          
          <span class={cn(
            "text-[13px] font-sans leading-tight text-center transition-all",
            isStandout() && props.isDataDocks ? "text-[#fd4f00] font-bold" : "",
            isStandout() && !props.isDataDocks ? "text-[#4a8136] font-bold" : "",
            props.detail?.level === "full" && !isStandout() ? "text-[#4a8136]" : "",
            props.detail?.level === "partial" ? "text-[#eab308]" : "",
            props.detail?.level === "none" ? "text-[#9c806d]" : "",
            isStandout() && "animate-shine group-hover/row:brightness-125"
          )}>
            {props.detail?.text}
          </span>
        </div>
      </Show>
    </div>
  );
};

// ─── Feature Group Section ────────────────────────────────────────────────────

const FeatureGroupSection: Component<{
  group: ComparisonFeatureGroup;
  competitor1: ComparisonCompetitor;
  competitor2: ComparisonCompetitor | null;
  isExpanded: () => boolean;
  onToggle: () => void;
}> = (props) => {
  return (
    <div role="rowgroup" class="border border-[#ece6de] rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-sm">
      {/* Group header */}
      <button
        type="button"
        onClick={() => props.onToggle()}
        class="w-full flex items-center justify-between px-5 py-4 bg-[#faf8f5] hover:bg-[#ece6de]/40 transition-colors duration-150 cursor-pointer group"
        aria-expanded={props.isExpanded()}
      >
        <div class="flex items-center gap-3">
          <span class={cn(
            "flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-200",
            props.isExpanded() ? "bg-[#5f483a] text-white" : "bg-[#ece6de] text-[#5f483a] group-hover:bg-[#ad9686] group-hover:text-white"
          )}>
            <svg
              class={cn("w-3.5 h-3.5 transition-transform duration-200", props.isExpanded() && "rotate-180")}
              fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </span>
          <div class="flex items-center gap-2">
            <span class="text-sm md:text-base font-semibold text-[#5f483a] font-recoleta">{props.group.label}</span>
          </div>
        </div>
      </button>

      {/* Feature rows - rendered in DOM for SSR/bots, hidden via CSS when collapsed */}
      <div class={cn("divide-y divide-[#ece6de]", !props.isExpanded() && "hidden")}>
        <For each={props.group.features}>
          {(feature: ComparisonFeature) => {
            const ddDetail = () => datadocksFeatures?.[feature.id] || { level: "none", text: "Not available" };
            const comp1Detail = () => props.competitor1?.features?.[feature.id] || { level: "none", text: "Not available" };
            const comp2Detail = () => props.competitor2 ? (props.competitor2?.features?.[feature.id] || { level: "none", text: "Not available" }) : null;

            return (
              <div
                role="row"
                class={cn(
                  "group/row grid items-stretch gap-2 md:gap-4 px-5 py-2 hover:bg-[#faf8f5]/50 transition-colors duration-100",
                  props.competitor2 
                    ? "grid-cols-[1fr_minmax(120px,180px)_minmax(120px,180px)_minmax(120px,180px)]" 
                    : "grid-cols-[1fr_minmax(120px,180px)_minmax(120px,180px)]"
                )}
              >
                {/* Feature name */}
                <div role="cell" class="min-w-0 flex items-center gap-1.5">
                  <span class="text-sm text-[#5f483a] font-sans leading-snug">{feature.label}</span>
                </div>

                {/* DataDocks value */}
                <div role="cell" class="flex items-center justify-center" aria-label={`DataDocks: ${ddDetail().text}`}>
                  <SupportCell detail={ddDetail()} isDataDocks={true} />
                </div>

                {/* Competitor 1 value */}
                <div role="cell" class="flex items-center justify-center" aria-label={`${props.competitor1.name}: ${comp1Detail().text}`}>
                  <SupportCell detail={comp1Detail()} />
                </div>

                {/* Competitor 2 value */}
                <Show when={props.competitor2}>
                  <div role="cell" class="flex items-center justify-center" aria-label={`${props.competitor2?.name}: ${comp2Detail()?.text || ''}`}>
                    <SupportCell detail={comp2Detail()} />
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

// ─── Competitor Selector ──────────────────────────────────────────────────────

const CompetitorSelector: Component<{
  competitors: ComparisonCompetitor[];
  selected: ComparisonCompetitor | null;
  onSelect: (c: ComparisonCompetitor) => void;
  placeholder?: string;
}> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <div class="relative w-full h-full flex flex-col justify-end">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen());
        }}
        class={cn(
          "w-full flex items-center justify-between gap-2 rounded-xl border border-[#ad9686]/60 bg-white px-4 py-2",
          "hover:border-[#5f483a] transition-all duration-200 cursor-pointer shadow-sm min-h-[58px]",
          "focus:outline-none focus:ring-2 focus:ring-[#fd4f00]/30",
          isOpen() && "border-[#5f483a]",
          !props.selected && "border-dashed bg-[#faf8f5]"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen()}
      >
        <div class="flex-1 text-left min-w-0">
          <Show when={props.selected} fallback={<span class="text-[13px] text-[#ad9686] font-sans">{props.placeholder || "Select..."}</span>}>
            {(sel) => (
              <>
                <span class="block text-[15px] font-semibold text-[#5f483a] font-sans leading-tight">{sel().name}</span>
                <span class="block text-[11px] text-[#9c806d] mt-0.5 leading-tight">{sel().tagline}</span>
              </>
            )}
          </Show>
        </div>
        <svg
          class={cn("w-4 h-4 text-[#ad9686] shrink-0 transition-transform duration-200", isOpen() && "rotate-180")}
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <Show when={isOpen()}>
        <div class="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
        <div
          class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[240px] z-50 bg-white rounded-xl border border-[#ece6de] shadow-lg overflow-hidden max-h-[260px] overflow-y-auto"
          role="listbox"
        >
          <For each={props.competitors}>
            {(competitor) => (
              <button
                type="button"
                role="option"
                aria-selected={props.selected?.id === competitor.id}
                onClick={(e) => {
                  e.stopPropagation();
                  props.onSelect(competitor);
                  setIsOpen(false);
                }}
                class={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 cursor-pointer border-b border-[#ece6de]/50 last:border-0",
                  props.selected?.id === competitor.id
                    ? "bg-[#faf8f5]"
                    : "hover:bg-[#ece6de]/50"
                )}
              >
                <div class="flex-1 min-w-0">
                  <span class="block text-sm font-semibold text-[#5f483a] font-sans">{competitor.name}</span>
                  <span class="block text-[11px] text-[#9c806d] truncate">{competitor.tagline}</span>
                </div>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ComparisonTable: Component = () => {
  const sortedCompetitors = createMemo(() =>
    [...comparisonCompetitors].sort((a, b) => a.name.localeCompare(b.name))
  );

  const defaultComp = comparisonCompetitors.find((c) => c.id === "c3-solutions") || sortedCompetitors()[0];

  const [selectedCompetitor1, setSelectedCompetitor1] = createSignal<ComparisonCompetitor>(
    defaultComp
  );
  const [selectedCompetitor2, setSelectedCompetitor2] = createSignal<ComparisonCompetitor | null>(null);

  // Track which groups are expanded (collapsed by default as requested)
  const [expandedGroups, setExpandedGroups] = createSignal<Set<string>>(new Set<string>());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(comparisonFeatureGroups.map((g) => g.id)));
  const collapseAll = () => setExpandedGroups(new Set<string>());

  const addThirdColumn = () => {
    // Pick the first competitor that isn't competitor 1
    const available = sortedCompetitors().find((c) => c.id !== selectedCompetitor1().id);
    if (available) setSelectedCompetitor2(available);
  };

  return (
    <div class="space-y-6" role="table" aria-label="Dock Scheduling Side-by-Side Features Comparison">
      
      {/* Title & Controls */}
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 text-center md:text-left">
        <h2 class="font-bruta text-3xl md:text-4xl lg:text-5xl uppercase tracking-wide">
          <span class="text-black">COMPARE DOCK SCHEDULING FEATURES, </span><span class="text-[#fd4f00]">SIDE-BY-SIDE</span>
        </h2>
        <div class="flex items-center justify-center gap-3 shrink-0 mb-1">
          <button
            type="button"
            onClick={expandAll}
            class="text-[11px] font-mono font-bold uppercase tracking-widest text-[#9c806d] hover:text-[#5f483a] transition-colors duration-150 cursor-pointer"
          >
            Expand all
          </button>
          <span class="text-[#ece6de] text-[11px]">|</span>
          <button
            type="button"
            onClick={collapseAll}
            class="text-[11px] font-mono font-bold uppercase tracking-widest text-[#9c806d] hover:text-[#5f483a] transition-colors duration-150 cursor-pointer"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* ── Column headers ── */}
      <div
        role="row"
        class={cn(
          "grid items-end gap-2 md:gap-4 px-5 pb-3 border-b border-[#ad9686] sticky top-0 bg-white/95 backdrop-blur-sm z-20 pt-4 -mt-4",
          selectedCompetitor2() 
            ? "grid-cols-[1fr_minmax(120px,180px)_minmax(120px,180px)_minmax(120px,180px)]" 
            : "grid-cols-[1fr_minmax(120px,180px)_minmax(120px,180px)]"
        )}
      >
        {/* Empty space for the feature name column */}
        <div role="columnheader" aria-label="Feature"></div>
        
        {/* DataDocks Fixed Pill */}
        <div role="columnheader" class="flex flex-col w-full h-full justify-end">
          <div class="w-full flex items-center justify-start gap-2 rounded-xl border border-[#ece6de] bg-white px-4 py-2 cursor-default shadow-sm relative min-h-[58px]">
            <div class="flex-1 text-left min-w-0 font-sans">
              <span class="block text-[15px] font-bold text-[#fd4f00] leading-tight tracking-wide">DataDocks</span>
              <span class="block text-[11px] text-[#9c806d] mt-0.5 leading-tight whitespace-nowrap overflow-hidden text-ellipsis md:whitespace-normal md:overflow-visible md:text-wrap font-recoleta">Enterprise dock & yard management</span>
            </div>
          </div>
        </div>
        
        {/* Competitor 1 Selector */}
        <div role="columnheader" class="flex flex-col relative w-full h-full">
          <CompetitorSelector
            competitors={sortedCompetitors().filter(c => c.id !== selectedCompetitor2()?.id)}
            selected={selectedCompetitor1()}
            onSelect={setSelectedCompetitor1}
          />
          <Show when={!selectedCompetitor2()}>
            {/* (+) button absolutely positioned to sit completely outside the right edge of the grid cell */}
            <button
              onClick={addThirdColumn}
              class="absolute left-full top-1/2 -translate-y-1/2 ml-4 h-6 w-6 rounded-full bg-white border border-[#ece6de] flex items-center justify-center text-[#ad9686] hover:text-[#fd4f00] hover:border-[#fd4f00]/50 transition-colors tooltip-trigger shadow-sm shrink-0"
              title="Add another competitor"
              aria-label="Add another competitor"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </Show>
        </div>

        {/* Competitor 2 Selector */}
        <Show when={selectedCompetitor2()}>
          <div role="columnheader" class="flex flex-col relative w-full h-full group">
            <CompetitorSelector
              competitors={sortedCompetitors().filter(c => c.id !== selectedCompetitor1().id)}
              selected={selectedCompetitor2()}
              onSelect={(c) => setSelectedCompetitor2(c)}
              placeholder="Select..."
            />
            {/* Close button layered on the corner of the selector */}
            <div class="absolute -top-1.5 -right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
               <button
                  onClick={() => setSelectedCompetitor2(null)}
                  class="h-5 w-5 rounded-full bg-white border border-[#ece6de] flex items-center justify-center text-[#ad9686] hover:bg-[#ece6de] hover:text-[#5f483a] transition-colors shadow-sm"
                  title="Remove column"
                  aria-label="Remove column"
               >
                  <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </button>
            </div>
          </div>
        </Show>
      </div>

      {/* ── Feature groups ── */}
      <div role="rowgroup" class="space-y-3">
        <For each={comparisonFeatureGroups}>
          {(group) => (
            <FeatureGroupSection
              group={group}
              competitor1={selectedCompetitor1()}
              competitor2={selectedCompetitor2()}
              isExpanded={() => expandedGroups().has(group.id)}
              onToggle={() => toggleGroup(group.id)}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default ComparisonTable;
