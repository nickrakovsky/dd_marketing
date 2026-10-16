/** @jsxImportSource solid-js */
import { createSignal, createMemo, createUniqueId, onMount, onCleanup, For, Show } from "solid-js";
import type { Component } from "solid-js";
import "./ComparisonTable.css";
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

const supportLabels = {
  standout: "Standout",
  full: "Full support",
  partial: "Partial support",
  none: "Not available",
};

// The wider matrix retains its original status palette.
const supportIconColors = {
  standout: "border-[#4a8136] text-[#4a8136]",
  full: "border-[#4a8136] text-[#4a8136]",
  partial: "border-[#eab308] text-[#eab308]",
  none: "border-[#9c806d] text-[#9c806d]",
};

// At 900px, the page gutters leave 222px for features plus three 180px systems.
// Keep the component styles, CSS tablet range, and viewport listener in sync.
const comparisonColumns = (hasThirdSystem: boolean) => hasThirdSystem
  ? "min-[900px]:grid-cols-[minmax(0,1fr)_180px_180px_180px]"
  : "min-[900px]:grid-cols-[minmax(0,1fr)_180px_180px]";

const supportTextColors = {
  standout: "min-[900px]:text-[#4a8136]",
  full: "min-[900px]:text-[#4a8136]",
  partial: "min-[900px]:text-[#eab308]",
  none: "min-[900px]:text-[#9c806d]",
};

// Standout is green for other systems; DataDocks retains its orange accent.
const mobileSupportColors = {
  standout: "bg-[#e4efd9] text-[#2e5623] font-bold",
  full: "bg-[#edf4e8] text-[#37632a]",
  partial: "bg-[#fff5d6] text-[#795600]",
  none: "bg-[#f2efeb] text-[#65594f]",
};

const focusClasses = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5f483a]";

const SupportIcon: Component<{ level: FeatureDetail["level"]; compact?: boolean }> = (props) => {
  const size = () => props.compact ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <>
      <Show when={props.level === "standout"}>
        <svg class={size()} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </Show>
      <Show when={props.level === "full"}>
        <svg class={size()} fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
      </Show>
      <Show when={props.level === "partial"}>
        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>
      </Show>
      <Show when={props.level === "none"}>
        <svg class={size()} fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </Show>
    </>
  );
};

const MobileSupportLabel: Component<{ vendor: string; detail: FeatureDetail | null; isDataDocks?: boolean }> = (props) => (
  // Column headers and the answer's accessible status already supply these labels.
  <div aria-hidden="true" class="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans min-[900px]:hidden">
    <span class="min-w-0 break-words text-[13px] font-semibold text-[#5f483a]">{props.vendor}</span>
    <Show when={props.detail}>
      <span class={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs leading-4 font-semibold", props.isDataDocks && props.detail!.level === "standout" ? "bg-[#fff0e6] text-[#46342a] [&_svg]:text-[#fd4f00]" : mobileSupportColors[props.detail!.level])}>
        <SupportIcon level={props.detail!.level} compact />
        {supportLabels[props.detail!.level]}
      </span>
    </Show>
  </div>
);

const SupportCell: Component<{ detail: FeatureDetail | null | undefined; isDataDocks?: boolean }> = (props) => {
  const isStandout = () => props.detail?.level === "standout";
  const iconColorClasses = () => {
    if (!props.detail) return "";
    return isStandout() && props.isDataDocks
      ? "border-[#fd4f00] text-[#fd4f00]"
      : supportIconColors[props.detail.level];
  };

  return (
    <div class="h-full w-full min-w-0 flex items-start min-[900px]:items-center min-[900px]:justify-center min-[900px]:p-2 rounded-lg">
      <Show when={props.detail}>
        <div class={cn("flex items-start min-[900px]:items-center gap-2 max-w-full min-w-0 font-sans text-[#46342a]", isStandout() && props.isDataDocks ? "min-[900px]:text-[#fd4f00]" : supportTextColors[props.detail!.level])}>
          <span aria-hidden="true" class={cn("hidden min-[900px]:flex shrink-0 h-5 w-5 rounded-full border items-center justify-center", iconColorClasses())}>
            <SupportIcon level={props.detail!.level} />
          </span>
          <span class={cn(
            "min-w-0 break-words text-base leading-relaxed text-left min-[900px]:text-[13px] min-[900px]:leading-snug min-[900px]:text-center",
            isStandout() && "min-[900px]:font-bold"
          )}>
            <span class="sr-only">{supportLabels[props.detail!.level]}: </span>
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
  columnCount: number;
  isExpanded: () => boolean;
  onToggle: () => void;
}> = (props) => {
  const rowsId = createUniqueId();
  return (
    <div role="rowgroup" class="border border-[#ece6de] rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-sm">
      {/* Group header */}
      <div role="row">
        <div role="cell" aria-colspan={props.columnCount}>
          <button
            type="button"
            onClick={() => props.onToggle()}
            class="w-full flex items-center justify-between px-4 min-[900px]:px-5 py-4 text-left bg-[#faf8f5] hover:bg-[#ece6de]/40 transition-colors duration-150 cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#5f483a]"
            aria-expanded={props.isExpanded()}
            aria-controls={rowsId}
          >
            <div class="flex items-center gap-3">
              <span aria-hidden="true" class={cn(
                "flex shrink-0 h-6 w-6 items-center justify-center rounded-md transition-colors duration-200",
                props.isExpanded() ? "bg-[#5f483a] text-white" : "bg-[#ece6de] text-[#5f483a] group-hover:bg-[#5f483a] min-[900px]:group-hover:bg-[#ad9686] group-hover:text-white"
              )}>
                <svg
                  class={cn("w-3.5 h-3.5 transition-transform duration-200", props.isExpanded() && "rotate-180")}
                  fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
              <div class="flex items-center gap-2">
                <span class="text-base font-bold text-[#46342a] font-sans min-[900px]:font-recoleta min-[900px]:font-semibold min-[900px]:text-[#5f483a]">{props.group.label}</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Feature rows - rendered in DOM for SSR/bots, hidden via CSS when collapsed */}
      <div
        role="presentation"
        id={rowsId}
        hidden={!props.isExpanded()}
        data-system-count={props.competitor2 ? 3 : 2}
        class="comparison-features divide-y divide-[#ece6de]"
      >
        <For each={props.group.features}>
          {(feature: ComparisonFeature) => {
            const ddDetail = () => datadocksFeatures?.[feature.id] || { level: "none", text: "Not available" };
            const comp1Detail = () => props.competitor1?.features?.[feature.id] || { level: "none", text: "Not available" };
            const comp2Detail = () => props.competitor2 ? (props.competitor2?.features?.[feature.id] || { level: "none", text: "Not available" }) : null;

            return (
              <div
                role="row"
                class={cn(
                  "comparison-feature grid grid-cols-1 items-stretch gap-4 pb-5 min-[900px]:px-5 min-[900px]:py-2 min-[900px]:hover:bg-[#faf8f5]/50 transition-colors duration-100",
                  comparisonColumns(!!props.competitor2)
                )}
              >
                {/* Feature name */}
                <div role="rowheader" class="comparison-feature-title min-w-0 flex items-center gap-1.5 bg-[#faf8f5]/60 px-4 py-3 min-[900px]:bg-transparent min-[900px]:p-0">
                  <span class="text-lg font-recoleta font-semibold text-neutral-800 leading-snug min-[900px]:font-sans min-[900px]:text-sm min-[900px]:font-normal min-[900px]:text-[#5f483a]">{feature.label}</span>
                </div>

                {/* DataDocks value */}
                <div role="cell" class="comparison-answer min-w-0 flex flex-col px-4 min-[900px]:px-0 min-[900px]:justify-center">
                  <MobileSupportLabel vendor="DataDocks" detail={ddDetail()} isDataDocks />
                  <SupportCell detail={ddDetail()} isDataDocks={true} />
                </div>

                {/* Competitor 1 value */}
                <div role="cell" class="comparison-answer min-w-0 flex flex-col px-4 min-[900px]:px-0 min-[900px]:justify-center">
                  <MobileSupportLabel vendor={props.competitor1.name} detail={comp1Detail()} />
                  <SupportCell detail={comp1Detail()} />
                </div>

                {/* Competitor 2 value */}
                <Show when={props.competitor2}>
                  <div role="cell" class="comparison-answer min-w-0 flex flex-col px-4 min-[900px]:px-0 min-[900px]:justify-center">
                    <MobileSupportLabel vendor={props.competitor2!.name} detail={comp2Detail()} />
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
  onSelect: (c: ComparisonCompetitor | null) => void;
  label: string;
  optional?: boolean;
  selectRef?: (element: HTMLSelectElement) => void;
}> = (props) => {
  const taglineId = createUniqueId();
  return (
    <div class={cn("relative w-full flex items-center gap-2 min-[900px]:gap-1 rounded-xl border border-[#9c806d] min-[900px]:border-[#ad9686]/60 min-[900px]:hover:border-[#5f483a] px-4 min-[900px]:px-3 py-2 shadow-sm min-h-[58px] focus-within:ring-2 focus-within:ring-[#5f483a] focus-within:ring-offset-2", props.selected ? "bg-white" : "border-dashed bg-[#faf8f5]")}>
      {/* The native control supplies touch, keyboard, and popup positioning behavior. */}
      <select
        ref={props.selectRef}
        aria-label={props.label}
        aria-describedby={taglineId}
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
        value={props.selected?.id ?? ""}
        onChange={(event) => {
          const selected = props.competitors.find((competitor) => competitor.id === event.currentTarget.value);
          if (selected || props.optional) props.onSelect(selected ?? null);
        }}
      >
        <Show when={props.optional}>
          <option value="" selected={!props.selected}>No additional system</option>
        </Show>
        <For each={props.competitors}>
          {(competitor) => <option value={competitor.id} selected={competitor.id === props.selected?.id}>{competitor.name}</option>}
        </For>
      </select>
      <div class="flex-1 text-left min-w-0 pointer-events-none">
        <span aria-hidden="true" class={cn("block text-base min-[900px]:text-[15px] font-sans leading-tight break-words", props.selected ? "font-semibold text-[#5f483a]" : "font-medium text-[#775f50]")}>{props.selected?.name ?? "Add another system"}</span>
        <span id={taglineId} class={cn("block text-xs min-[900px]:text-[11px] min-[900px]:text-[#9c806d] mt-0.5 leading-snug", props.selected ? "text-[#5f483a]" : "text-[#775f50]")}>{props.selected?.tagline ?? "Optional third system"}</span>
      </div>
      <svg aria-hidden="true" class={cn("w-4 h-4 shrink-0 pointer-events-none", props.selected ? "text-[#9c806d]" : "text-[#775f50]")} fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d={props.selected ? "M19.5 8.25l-7.5 7.5-7.5-7.5" : "M12 5v14m-7-7h14"} />
      </svg>
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
  const [isMobile, setIsMobile] = createSignal(false);
  const columnCount = () => isMobile() || selectedCompetitor2() ? 4 : 3;
  let addSystemButton: HTMLButtonElement | undefined;
  let secondSystemSelect: HTMLSelectElement | undefined;

  onMount(() => {
    const wideViewport = window.matchMedia("(min-width: 900px)");
    const updateViewport = () => {
      setIsMobile(!wideViewport.matches);
      if (!wideViewport.matches) {
        setExpandedGroups((previous) => previous.size > 1
          ? new Set([previous.values().next().value!])
          : previous);
      }
    };
    updateViewport();
    wideViewport.addEventListener("change", updateViewport);
    onCleanup(() => wideViewport.removeEventListener("change", updateViewport));
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        if (isMobile()) next.clear();
        next.add(groupId);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(comparisonFeatureGroups.map((g) => g.id)));
  const collapseAll = () => setExpandedGroups(new Set<string>());

  const [announcement, setAnnouncement] = createSignal("");
  const selectFirst = (competitor: ComparisonCompetitor) => {
    setSelectedCompetitor1(competitor);
    setAnnouncement(`Comparison updated: DataDocks, ${competitor.name}${selectedCompetitor2() ? `, ${selectedCompetitor2()!.name}` : ""}.`);
  };
  const selectSecond = (competitor: ComparisonCompetitor | null) => {
    setSelectedCompetitor2(competitor);
    setAnnouncement(competitor
      ? `Comparison updated: DataDocks, ${selectedCompetitor1().name}, ${competitor.name}.`
      : `Comparison updated: DataDocks and ${selectedCompetitor1().name}.`);
    if (!competitor && !isMobile()) queueMicrotask(() => addSystemButton?.focus());
  };
  const addSystem = () => {
    const nextSystem = sortedCompetitors().find((competitor) => competitor.id !== selectedCompetitor1().id);
    if (!nextSystem) return;
    selectSecond(nextSystem);
    queueMicrotask(() => secondSystemSelect?.focus());
  };

  return (
    <div class="comparison-table space-y-6 font-sans min-[900px]:font-recoleta">
      
      {/* Title & Controls */}
      <div class="flex flex-col min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between gap-4 text-center min-[900px]:text-left">
        <h2 class="comparison-title font-bruta text-[28px] min-[360px]:text-[32px] min-[900px]:text-5xl leading-[1.12] uppercase tracking-wide text-black">
          COMPARE DOCK<br class="min-[480px]:hidden" />{" "}
          SCHEDULING<br class="hidden min-[480px]:inline min-[900px]:hidden" />{" "}
          FEATURES,<br class="min-[480px]:hidden" />{" "}
          <span class="whitespace-nowrap text-[#fd4f00]">SIDE-BY-SIDE</span>
        </h2>
        <div class="hidden min-[900px]:flex items-center justify-center gap-3 shrink-0 mb-1">
          <button
            type="button"
            onClick={expandAll}
            class={cn("min-h-11 px-2 text-[11px] font-mono font-bold uppercase tracking-widest text-[#9c806d] hover:text-[#5f483a] transition-colors duration-150 cursor-pointer", focusClasses)}
          >
            Expand all
          </button>
          <span aria-hidden="true" class="text-[#ece6de] text-[11px]">|</span>
          <button
            type="button"
            onClick={collapseAll}
            class={cn("min-h-11 px-2 text-[11px] font-mono font-bold uppercase tracking-widest text-[#9c806d] hover:text-[#5f483a] transition-colors duration-150 cursor-pointer", focusClasses)}
          >
            Collapse all
          </button>
        </div>
      </div>

      <p class="sr-only" role="status">{announcement()}</p>

      <div role="table" aria-label="Dock Scheduling Side-by-Side Features Comparison" aria-colcount={columnCount()} class="space-y-3">
        {/* ── Column headers ── */}
        <div
          role="row"
          class={cn(
            "grid grid-cols-1 items-start min-[900px]:items-end gap-3 min-[900px]:gap-4 px-4 min-[900px]:px-[21px] pb-3 border-b border-[#ad9686] min-[900px]:sticky min-[900px]:top-0 bg-white min-[900px]:bg-white/95 min-[900px]:backdrop-blur-sm z-20 pt-4",
            comparisonColumns(!!selectedCompetitor2())
          )}
        >
          <div role="columnheader" class="sr-only min-[900px]:not-sr-only"><span class="sr-only">Feature</span></div>
          <div role="columnheader" aria-label="DataDocks" class="min-w-0 flex flex-col w-full">
            <div class="w-full flex items-center justify-start gap-2 rounded-xl border border-[#ece6de] bg-white px-4 py-2 shadow-sm min-h-[58px]">
              <div class="flex-1 text-left min-w-0 font-sans">
                <span class="block text-[19px] min-[900px]:text-[15px] font-bold text-[#fd4f00] leading-tight tracking-wide">DataDocks</span>
                <span class="block text-xs min-[900px]:text-[11px] text-[#5f483a] min-[900px]:text-[#9c806d] mt-0.5 leading-snug font-sans min-[900px]:font-recoleta">Enterprise dock &amp; yard management</span>
              </div>
            </div>
          </div>
          <div role="columnheader" class="relative min-w-0 flex flex-col gap-2 w-full" aria-label={selectedCompetitor1().name}>
            <CompetitorSelector
              competitors={sortedCompetitors().filter(c => c.id !== selectedCompetitor2()?.id)}
              selected={selectedCompetitor1()}
              onSelect={(competitor) => { if (competitor) selectFirst(competitor); }}
              label="First system"
            />
            <Show when={!selectedCompetitor2()}>
              <button
                ref={addSystemButton}
                type="button"
                onClick={addSystem}
                aria-label="Add another system"
                title="Add another system"
                class={cn("hidden min-[900px]:flex absolute left-full top-1/2 -translate-y-1/2 ml-2 min-[1024px]:ml-4 h-6 w-6 rounded-full bg-white border border-[#ece6de] items-center justify-center text-[#ad9686] hover:text-[#fd4f00] hover:border-[#fd4f00]/50 transition-colors shadow-sm after:absolute after:-inset-2.5", focusClasses)}
              >
                <svg aria-hidden="true" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 5v14m-7-7h14" /></svg>
              </button>
            </Show>
          </div>
          <div role="columnheader" class={cn("relative min-w-0 flex flex-col w-full group", !selectedCompetitor2() && "min-[900px]:hidden")} aria-label={selectedCompetitor2()?.name ?? "Additional system"}>
            <CompetitorSelector
              competitors={sortedCompetitors().filter(c => c.id !== selectedCompetitor1().id)}
              selected={selectedCompetitor2()}
              onSelect={selectSecond}
              label="Second system"
              selectRef={(element) => { secondSystemSelect = element; }}
              optional
            />
            <Show when={selectedCompetitor2()}>
              <button
                type="button"
                onClick={() => selectSecond(null)}
                aria-label="Remove additional system"
                title="Remove additional system"
                class={cn("hidden min-[900px]:flex absolute -top-1.5 -right-1.5 z-10 h-6 w-6 rounded-full bg-white border border-[#ece6de] items-center justify-center text-[#ad9686] hover:text-[#fd4f00] hover:border-[#fd4f00]/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-colors after:absolute after:-inset-2.5", focusClasses)}
              >
                <svg aria-hidden="true" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="m6 6 12 12M6 18 18 6" /></svg>
              </button>
            </Show>
          </div>
        </div>

        {/* ── Feature groups ── */}
        <div role="presentation" class="space-y-3">
          <For each={comparisonFeatureGroups}>
            {(group) => (
              <FeatureGroupSection
                group={group}
                competitor1={selectedCompetitor1()}
                competitor2={selectedCompetitor2()}
                columnCount={columnCount()}
                isExpanded={() => expandedGroups().has(group.id)}
                onToggle={() => toggleGroup(group.id)}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
