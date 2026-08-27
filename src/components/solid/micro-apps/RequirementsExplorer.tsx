/** @jsxImportSource solid-js */
import { For, Show, createSignal, createMemo } from "solid-js";
import type { Component } from "solid-js";
import { cn } from "@/components/solid/lib/utils";
import { requirementsState, updateRequirementsState, recommendedOutcome, completionScore } from "./RequirementsEngine";
import { CarrierTriangle } from "./CarrierTriangle";

// --- UI Primitives ---

const SectionCard: Component<{ title: string; children: any; class?: string }> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <div class={cn("rounded-xl border border-[#ece6de] bg-[#faf8f5] shadow-sm overflow-hidden transition-all", props.class)}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen())}
        class="w-full flex items-center justify-between p-4 sm:p-5 text-left md:pointer-events-none select-none focus:outline-none cursor-pointer md:cursor-default bg-[#faf8f5]"
      >
        <h4 class="text-xs font-bold uppercase tracking-widest text-[#9c806d] font-sans">{props.title}</h4>
        <span class="md:hidden text-[#9c806d] text-xs font-sans font-medium flex items-center gap-1.5 bg-[#ece6de]/60 px-2.5 py-1 rounded-full">
          <span>{isOpen() ? "Collapse" : "Tap to edit"}</span>
          <svg class={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen() ? "rotate-180" : "rotate-0")} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div class={cn("px-4 pb-4 sm:px-5 sm:pb-5 pt-0 md:block", isOpen() ? "block" : "hidden")}>
        {props.children}
      </div>
    </div>
  );
};

const RadioGroup: Component<{
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  vertical?: boolean;
  compact?: boolean;
  gridCols?: number;
  class?: string;
}> = (props) => (
  <div class={props.class}>
    <Show when={props.label}>
      <p class="mb-2 text-sm font-medium text-[#5f483a] font-sans">{props.label}</p>
    </Show>
    <div
      class={cn(
        props.gridCols
          ? `grid gap-1.5 ${props.gridCols === 4 ? "grid-cols-4" : props.gridCols === 3 ? "grid-cols-3" : "grid-cols-2"}`
          : props.vertical
          ? "flex flex-col gap-2"
          : "flex flex-wrap gap-2"
      )}
    >
      <For each={props.options}>
        {(opt) => {
          const isSelected = () => props.value === opt.value;
          return (
            <button
              type="button"
              onClick={() => props.onChange(opt.value)}
              class={cn(
                "rounded-full border text-xs sm:text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd4f00] font-recoleta font-medium tracking-wide cursor-pointer select-none truncate text-center",
                props.gridCols ? "px-1 py-1.5 w-full" : props.compact ? "px-3 py-1" : "px-4 py-1.5",
                props.vertical ? "text-left" : ""
              )}
              classList={{
                "border-[#fd4f00] bg-[#fd4f00] text-white shadow-sm": isSelected(),
                "border-[#ece6de] bg-white text-[#5f483a] hover:border-[#9c806d] hover:bg-[#faf8f5]": !isSelected()
              }}
            >
              {opt.label}
            </button>
          );
        }}
      </For>
    </div>
  </div>
);

const MultiSelectGroup: Component<{
  label?: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
  gridCols?: number;
  tieredCols?: number[];
  chipMosaic?: boolean;
  class?: string;
}> = (props) => {
  const getTiers = () => {
    if (!props.tieredCols) return [props.options];
    const tiers: { value: string; label: string }[][] = [];
    let idx = 0;
    for (const cols of props.tieredCols) {
      const chunk = props.options.slice(idx, idx + cols);
      if (chunk.length > 0) tiers.push(chunk);
      idx += cols;
    }
    if (idx < props.options.length) {
      tiers.push(props.options.slice(idx));
    }
    return tiers;
  };

  return (
    <div class={props.class}>
      <Show when={props.label}>
        <p class="mb-2 text-sm font-medium text-[#5f483a] font-sans">{props.label}</p>
      </Show>
      <div class="space-y-2">
        <For each={getTiers()}>
          {(tierOptions, tierIdx) => {
            const colCount = props.tieredCols ? props.tieredCols[tierIdx()] || tierOptions.length : props.gridCols;
            const gridClass = colCount === 2 ? "grid-cols-2" : colCount === 3 ? "grid-cols-3" : colCount === 4 ? "grid-cols-4" : "grid-cols-1";
            return (
              <div
                class={cn(
                  props.chipMosaic
                    ? "flex flex-wrap gap-2"
                    : (props.gridCols || props.tieredCols)
                    ? `grid gap-2 ${gridClass}`
                    : "flex flex-wrap gap-2"
                )}
              >
                <For each={tierOptions}>
                  {(opt) => {
                    const isSelected = () => props.values.includes(opt.value);
                    const toggle = () => {
                      if (isSelected()) props.onChange(props.values.filter(v => v !== opt.value));
                      else props.onChange([...props.values, opt.value]);
                    };
                    return (
                      <button
                        type="button"
                        onClick={toggle}
                        class={cn(
                          "rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd4f00] font-recoleta font-medium tracking-wide cursor-pointer select-none text-center flex items-center justify-center leading-snug",
                          props.chipMosaic
                            ? "flex-[1_1_28%] px-2.5 py-1.5 min-h-[34px] text-[11px] sm:text-xs whitespace-normal"
                            : props.tieredCols
                            ? "w-full px-2 py-2 text-[11px] sm:text-xs min-h-[42px] whitespace-normal"
                            : props.gridCols
                            ? "w-full px-2 py-1.5 text-xs sm:text-sm truncate min-h-[34px]"
                            : "px-3 py-1.5 text-xs sm:text-sm min-h-[34px]"
                        )}
                        classList={{
                          "border-[#fd4f00] bg-[#fd4f00]/10 text-[#fd4f00] shadow-sm": isSelected(),
                          "border-[#ece6de] bg-white text-[#5f483a] hover:border-[#9c806d] hover:bg-[#faf8f5]": !isSelected()
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  }}
                </For>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

const CheckboxListGroup: Component<{
  label?: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
  gridCols?: number;
  class?: string;
}> = (props) => (
  <div class={props.class}>
    <Show when={props.label}>
      <p class="mb-3 text-sm font-medium text-[#5f483a] font-sans">{props.label}</p>
    </Show>
    <div
      class={cn(
        "grid gap-x-4 gap-y-3",
        props.gridCols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
      )}
    >
      <For each={props.options}>
        {(opt) => {
          const isSelected = () => props.values.includes(opt.value);
          const toggle = () => {
            if (isSelected()) props.onChange(props.values.filter(v => v !== opt.value));
            else props.onChange([...props.values, opt.value]);
          };
          return (
            <div
              onClick={toggle}
              class="inline-flex items-center gap-2.5 cursor-pointer group select-none w-max max-w-full"
            >
              <div
                class={cn(
                  "shrink-0 w-[18px] h-[18px] rounded border transition-all flex items-center justify-center cursor-pointer",
                  isSelected()
                    ? "border-[#fd4f00] bg-[#fd4f00] text-white"
                    : "border-[#ece6de] bg-white group-hover:border-[#9c806d]"
                )}
              >
                <Show when={isSelected()}>
                  <svg class="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 6L5 9L10 3" />
                  </svg>
                </Show>
              </div>
              <span 
                class={cn(
                  "text-sm font-sans leading-none select-none font-normal transition-colors",
                  isSelected() ? "text-black" : "text-[#5f483a]/80 group-hover:text-[#5f483a]"
                )}
              >
                {opt.label}
              </span>
            </div>
          );
        }}
      </For>
    </div>
  </div>
);

const SelectGroup: Component<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  otherValue?: string;
  onOtherChange?: (v: string) => void;
  class?: string;
}> = (props) => (
  <div class={props.class}>
    <p class="mb-2 text-sm font-medium text-[#5f483a] font-sans">{props.label}</p>
    <div class="flex flex-col gap-2">
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.currentTarget.value)}
        class="w-full rounded-lg border border-[#ece6de] bg-white px-3 py-2 text-sm text-[#5f483a] font-recoleta focus:border-[#fd4f00] focus:outline-none focus:ring-1 focus:ring-[#fd4f00] hover:border-[#9c806d] cursor-pointer"
      >
        <For each={props.options}>
          {(opt) => <option value={opt.value} disabled={opt.disabled}>{opt.label}</option>}
        </For>
      </select>
      <Show when={props.value === "other" && props.onOtherChange !== undefined}>
        <input
          type="text"
          placeholder="Please specify..."
          value={props.otherValue || ""}
          onInput={(e) => props.onOtherChange!(e.currentTarget.value)}
          class="w-full rounded-lg border border-[#ece6de] bg-white px-3 py-2 text-sm text-[#5f483a] font-sans focus:border-[#fd4f00] focus:outline-none focus:ring-1 focus:ring-[#fd4f00]"
        />
      </Show>
    </div>
  </div>
);

// ── Data Capture Grid ─────────────────────────────────────────────────────────

const DataCaptureGrid: Component<{
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  class?: string;
}> = (props) => {
  const docs = [
    { key: "bol", label: "Bills of Lading" },
    { key: "id", label: "Driver ID" },
    { key: "seal", label: "Seal Numbers" },
    { key: "po", label: "PO / Reference #" },
    { key: "trailer", label: "Trailer / Plate #" },
  ];
  const timings = [
    { key: "pre-arrival", label: "Pre-arrival" },
    { key: "checkin", label: "At Check-in" },
    { key: "after-docking", label: "After Docking" },
  ];

  const toggleDoc = (docKey: string) => {
    const next = { ...props.value };
    if (next[docKey]) {
      delete next[docKey];
    } else {
      next[docKey] = "checkin"; // default timing
    }
    props.onChange(next);
  };

  const setTiming = (docKey: string, timing: string) => {
    props.onChange({ ...props.value, [docKey]: timing });
  };

  return (
    <div class={props.class}>
      <p class="mb-3 text-sm font-medium text-[#5f483a] font-sans">Data captured</p>
      <div class="space-y-2.5">
        <For each={docs}>
          {(doc) => {
            const isActive = () => !!props.value[doc.key];
            return (
              <div class="flex flex-wrap items-center gap-2.5">
                <div
                  onClick={() => toggleDoc(doc.key)}
                  class="inline-flex items-center gap-2.5 cursor-pointer select-none group w-max max-w-full"
                >
                  <div
                    class="shrink-0 w-[18px] h-[18px] rounded border transition-all flex items-center justify-center cursor-pointer select-none"
                    classList={{
                      "border-[#fd4f00] bg-[#fd4f00] text-white": isActive(),
                      "border-[#ece6de] bg-white group-hover:border-[#9c806d]": !isActive()
                    }}
                  >
                    <Show when={isActive()}>
                      <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 6L5 9L10 3" />
                      </svg>
                    </Show>
                  </div>
                  <span 
                    class="text-sm font-sans min-w-[110px] select-none font-normal transition-colors leading-none"
                    classList={{
                      "text-black": isActive(),
                      "text-[#9c806d] group-hover:text-[#5f483a]": !isActive()
                    }}
                  >{doc.label}</span>
                </div>
                <Show when={isActive()}>
                  <div class="flex gap-1.5">
                    <For each={timings}>
                      {(t) => {
                        const isTimingSelected = () => props.value[doc.key] === t.key;
                        return (
                          <button
                            type="button"
                            onClick={() => setTiming(doc.key, t.key)}
                            class="rounded-full border px-2.5 py-0.5 text-[11px] transition-all font-recoleta font-medium cursor-pointer select-none"
                            classList={{
                              "border-[#fd4f00] bg-[#fd4f00]/10 text-[#fd4f00]": isTimingSelected(),
                              "border-[#ece6de] bg-white text-[#9c806d] hover:border-[#9c806d]": !isTimingSelected()
                            }}
                          >
                            {t.label}
                          </button>
                        );
                      }}
                    </For>
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

// --- Main Component ---

const THRESHOLD = 42;

const RequirementsExplorer: Component = () => {
  const [showOutput, setShowOutput] = createSignal(false);
  const [hoverDD, setHoverDD] = createSignal(false);
  const handleReveal = () => {
    if (completionScore() >= THRESHOLD) {
      setShowOutput(true);
      setTimeout(() => {
        document.getElementById("recommendation-output")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  // ── Derived: additional freight options depend on primary freight selection ──
  const additionalFreightOptions = createMemo(() => {
    const primary = requirementsState().primaryFreight;
    if (primary === "palletized-ftl") {
      return [
        { value: "ltl-small", label: "LTL & Smaller" },
        { value: "floor-loaded", label: "Floor Loaded" },
        { value: "reefer", label: "Reefer" },
        { value: "oversized", label: "Oversized / Flatbed" },
        { value: "container", label: "Shipping Container" },
      ];
    }
    if (primary === "ltl-small") {
      return [
        { value: "palletized-ftl", label: "Palletized FTL" },
        { value: "floor-loaded", label: "Floor Loaded" },
        { value: "reefer", label: "Reefer" },
        { value: "oversized", label: "Oversized / Flatbed" },
        { value: "container", label: "Shipping Container" },
      ];
    }
    // Default (nothing selected yet)
    return [
      { value: "floor-loaded", label: "Floor Loaded" },
      { value: "reefer", label: "Reefer" },
      { value: "oversized", label: "Oversized / Flatbed" },
      { value: "container", label: "Shipping Container" },
    ];
  });

  // Selecting primary freight type spawns the option in additional load types (does NOT auto-select)
  const handlePrimaryFreightChange = (v: string) => {
    updateRequirementsState("primaryFreight", v);
  };

  // ── Individual Section Cards (Reusable across layouts) ──
  const scaleVolumeCard = () => (
    <SectionCard title="Scale & Volume">
      <RadioGroup 
        label="Appointments per week"
        value={requirementsState().appointmentsPerWeek}
        onChange={(v) => updateRequirementsState("appointmentsPerWeek", v)}
        options={[
          { value: "<50", label: "< 50" },
          { value: "50-250", label: "50–250" },
          { value: "250-500", label: "250–500" },
          { value: "500+", label: "500+" }
        ]}
        gridCols={4}
        class="mb-5"
      />
      <RadioGroup 
        label="Dock doors"
        value={requirementsState().dockDoors}
        onChange={(v) => updateRequirementsState("dockDoors", v)}
        options={[
          { value: "<5", label: "< 5" },
          { value: "5-15", label: "5–15" },
          { value: "15-50", label: "15–50" },
          { value: "50+", label: "50+" }
        ]}
        gridCols={4}
        class="mb-5"
      />
      
      {/* Hours of Operation Grouping */}
      <div class="rounded-lg border border-[#ece6de] bg-white/60 p-3.5 space-y-3">
        <p class="text-xs font-bold uppercase tracking-wider text-[#9c806d] font-sans">Hours of Operation</p>
        <RadioGroup 
          value={requirementsState().daysPerWeek}
          onChange={(v) => updateRequirementsState("daysPerWeek", v)}
          options={[
            { value: "5d", label: "5 Days" },
            { value: "6d", label: "6 Days" },
            { value: "7d", label: "7 Days" }
          ]}
          gridCols={3}
        />
        <div class="border-t border-[#ece6de]/70 pt-3">
          <RadioGroup 
            value={requirementsState().hoursPerDay}
            onChange={(v) => updateRequirementsState("hoursPerDay", v)}
            options={[
              { value: "8h", label: "~8 Hours" },
              { value: "16h", label: "~16 Hours" },
              { value: "24h", label: "~24 Hours" }
            ]}
            gridCols={3}
          />
        </div>
      </div>
    </SectionCard>
  );

  const operationsToolsCard = () => (
    <SectionCard title="Operations & Tools">
      <RadioGroup 
        label="Yard operations"
        value={requirementsState().yardOperations}
        onChange={(v) => updateRequirementsState("yardOperations", v)}
        options={[
          { value: "live", label: "Live Load Only" },
          { value: "carrier-drop", label: "Carrier Drop & Hook" },
          { value: "jockeys", label: "Drop with Jockeys" },
          { value: "complex", label: "Complex Yard Ops" }
        ]}
        gridCols={2}
        class="mb-5"
      />
      <CheckboxListGroup
        label="Tools used today"
        values={requirementsState().currentTools}
        onChange={(v) => updateRequirementsState("currentTools", v)}
        options={[
          { value: "spreadsheet", label: "Spreadsheets" },
          { value: "whiteboard", label: "Whiteboards / Clipboards" },
          { value: "radios", label: "Walkie-Talkies / Radios" },
          { value: "email-phone", label: "Email / Phone Calls" },
          { value: "status-screen", label: "Dock Status Screens" },
          { value: "legacy-portal", label: "Legacy Booking Portals" },
          { value: "rfid", label: "RFID / Barcode Scanning" }
        ]}
        gridCols={2}
        class="mb-5"
      />
      <RadioGroup
        label="How are appointments made today?"
        value={requirementsState().schedulingExpectations}
        onChange={(v) => updateRequirementsState("schedulingExpectations", v)}
        options={[
          { value: "fcfs", label: "No appointments" },
          { value: "day-only", label: "Date-only (no time)" },
          { value: "block", label: "AM / PM blocks" },
          { value: "hourly", label: "Hourly slots" }
        ]}
        gridCols={2}
      />
    </SectionCard>
  );

  const carrierMixCard = () => (
    <SectionCard title="Carrier Mix">
       <CarrierTriangle 
          parentMix={requirementsState().parentCarrierMix}
          childMix={requirementsState().childCarrierMix}
          onParentChange={(mix) => updateRequirementsState("parentCarrierMix", mix)}
          onChildChange={(mix) => updateRequirementsState("childCarrierMix", mix)}
       />
    </SectionCard>
  );

  const techStackCard = () => (
    <SectionCard title="Tech Stack">
      <SelectGroup 
        label="Warehouse Management System"
        value={requirementsState().wms}
        onChange={(v) => updateRequirementsState("wms", v)}
        otherValue={requirementsState().wmsOther}
        onOtherChange={(v) => updateRequirementsState("wmsOther", v)}
        options={[
          { value: "none", label: "None / Spreadsheet" },
          { value: "separator-1", label: "──────", disabled: true },
          { value: "aptean", label: "Aptean (Ross/Oware)" },
          { value: "blue-yonder", label: "Blue Yonder" },
          { value: "camelot", label: "Camelot/Excalibur" },
          { value: "delmiaworks", label: "DELMIAworks / IQMS" },
          { value: "epicor", label: "Epicor" },
          { value: "extensiv", label: "Extensiv" },
          { value: "generix", label: "Generix/Solochain" },
          { value: "infor", label: "Infor" },
          { value: "made4net", label: "Made4net" },
          { value: "manhattan", label: "Manhattan Associates" },
          { value: "microsoft", label: "Microsoft" },
          { value: "oracle", label: "Oracle" },
          { value: "rockwell", label: "Rockwell Plex" },
          { value: "sap", label: "SAP" },
          { value: "shiphero", label: "ShipHero" },
          { value: "softeon", label: "Softeon" },
          { value: "separator-2", label: "──────", disabled: true },
          { value: "other", label: "Other WMS..." }
        ]}
        class="mb-4"
      />
      <SelectGroup 
        label="Transportation Management System"
        value={requirementsState().tms}
        onChange={(v) => updateRequirementsState("tms", v)}
        otherValue={requirementsState().tmsOther}
        onOtherChange={(v) => updateRequirementsState("tmsOther", v)}
        options={[
          { value: "none", label: "None / Not relevant" },
          { value: "separator-1", label: "──────", disabled: true },
          { value: "3gtms", label: "3Gtms" },
          { value: "alpega", label: "Alpega" },
          { value: "blue-yonder", label: "Blue Yonder" },
          { value: "descartes", label: "Descartes" },
          { value: "e2open", label: "E2open" },
          { value: "fourkites", label: "FourKites" },
          { value: "mcleod", label: "McLeod" },
          { value: "mercurygate", label: "MercuryGate" },
          { value: "oracle", label: "Oracle" },
          { value: "princeton-tmx", label: "Princeton TMX" },
          { value: "project44", label: "Project44" },
          { value: "sap", label: "SAP" },
          { value: "trimble", label: "Trimble" },
          { value: "separator-2", label: "──────", disabled: true },
          { value: "other", label: "Other TMS..." }
        ]}
        class="mb-4"
      />
      <SelectGroup 
        label="ERP System"
        value={requirementsState().erp}
        onChange={(v) => updateRequirementsState("erp", v)}
        otherValue={requirementsState().erpOther}
        onOtherChange={(v) => updateRequirementsState("erpOther", v)}
        options={[
          { value: "none", label: "Don't Know / Not Relevant" },
          { value: "separator-1", label: "──────", disabled: true },
          { value: "epicor", label: "Epicor" },
          { value: "infor-cloudsuite", label: "Infor CloudSuite" },
          { value: "microsoft-dynamics-365", label: "Microsoft Dynamics 365" },
          { value: "netsuite", label: "NetSuite" },
          { value: "oracle-fusion-cloud", label: "Oracle Fusion Cloud" },
          { value: "plex-by-rockwell-automation", label: "Plex by Rockwell Automation" },
          { value: "sage", label: "Sage" },
          { value: "sap-business-bydesign", label: "SAP Business ByDesign" },
          { value: "sap-s4hana", label: "SAP S/4HANA" },
          { value: "workday", label: "Workday" },
          { value: "separator-2", label: "──────", disabled: true },
          { value: "other", label: "Other ERP..." }
        ]}
      />
    </SectionCard>
  );

  const freightTypesCard = () => (
    <SectionCard title="Freight Types">
      <RadioGroup
        label="Primary freight"
        value={requirementsState().primaryFreight}
        onChange={handlePrimaryFreightChange}
        options={[
          { value: "palletized-ftl", label: "Palletized FTL" },
          { value: "ltl-small", label: "LTL & Smaller" },
          { value: "other-freight", label: "Other" }
        ]}
        gridCols={3}
        class="mb-4"
      />
      <Show
        when={requirementsState().primaryFreight === "other-freight"}
        fallback={
          <MultiSelectGroup
            label="Additional load types"
            values={requirementsState().additionalFreight}
            onChange={(v) => updateRequirementsState("additionalFreight", v)}
            options={additionalFreightOptions()}
          />
        }
      >
        <RadioGroup
          label="Specify primary load type"
          value={requirementsState().primaryFreightOtherSpec}
          onChange={(v) => updateRequirementsState("primaryFreightOtherSpec", v)}
          options={[
            { value: "floor-loaded", label: "Floor Loaded" },
            { value: "reefer", label: "Reefer" },
            { value: "oversized", label: "Oversized / Flatbed" },
            { value: "container", label: "Shipping Container" }
          ]}
          gridCols={2}
        />
      </Show>
    </SectionCard>
  );

  const checkInCard = () => (
    <SectionCard title="Check-in & Inspection">
       <div class="space-y-4">
         <RadioGroup 
           label="Check-in location"
           value={requirementsState().checkInLocation}
           onChange={(v) => updateRequirementsState("checkInLocation", v)}
           options={[
             { value: "guard-shack", label: "Guard Shack" },
             { value: "shipping-office", label: "Shipping Office" },
             { value: "self-checkin", label: "Driver Self Check-in" },
             { value: "yard", label: "Yard / Staging Area" }
           ]}
           gridCols={2}
         />
         <DataCaptureGrid
           value={requirementsState().dataCapture}
           onChange={(v) => updateRequirementsState("dataCapture", v)}
         />
       </div>
    </SectionCard>
  );

  const buyingContextCard = () => (
    <SectionCard title="Buying Context">
      <MultiSelectGroup
        label="Top pain points"
        values={requirementsState().painPoints}
        onChange={(v) => updateRequirementsState("painPoints", v)}
        options={[
          { value: "detention", label: "Detention / Demurrage" },
          { value: "overtime", label: "Overtime / Staffing" },
          { value: "freight-availability", label: "Freight Availability" },
          { value: "compliance", label: "Compliance" },
          { value: "inventory", label: "Inventory Accuracy" },
          { value: "dock-throughput", label: "Dock Throughput" }
        ]}
        gridCols={2}
        class="mb-5"
      />
      <CheckboxListGroup
        label="Buying committee"
        values={requirementsState().committee}
        onChange={(v) => updateRequirementsState("committee", v)}
        options={[
          { value: "it", label: "IT Manager" },
          { value: "senior-execs", label: "Senior Exec" },
          { value: "warehouse-ops", label: "Warehouse Manager" },
          { value: "transportation", label: "Transportation Manager" },
          { value: "project-manager", label: "Project / Implementation Lead" }
        ]}
        gridCols={2}
        class="mb-5"
      />
      
      <h5 class="text-sm font-medium text-[#5f483a] font-sans mb-2">Solutions you're considering</h5>
      <MultiSelectGroup
        values={requirementsState().solutionsConsidering}
        onChange={(v) => updateRequirementsState("solutionsConsidering", v)}
        options={[
          { value: "add-ons", label: "WMS/TMS Scheduling" },
          { value: "diy", label: "DIY / In-house" }
        ]}
        gridCols={2}
        class="mb-3"
      />
      <SelectGroup 
        label=""
        value={requirementsState().dedicatedProduct}
        onChange={(v) => updateRequirementsState("dedicatedProduct", v)}
        otherValue={requirementsState().dedicatedProductOther}
        onOtherChange={(v) => updateRequirementsState("dedicatedProductOther", v)}
        options={[
          { value: "none", label: "Dedicated dock scheduling system..." },
          { value: "separator-1", label: "──────", disabled: true },
          { value: "timify", label: "TIMIFY" },
          { value: "arrivy", label: "Arrivy" },
          { value: "c3", label: "C3 Solutions" },
          { value: "conduit", label: "Conduit" },
          { value: "datadocks", label: "DataDocks" },
          { value: "goramp", label: "GoRamp" },
          { value: "loadingcalendar", label: "LoadingCalendar" },
          { value: "prodocks", label: "ProDocks" },
          { value: "opendock", label: "Opendock" },
          { value: "trucksonthemap", label: "TrucksOnTheMap" },
          { value: "yardview", label: "YardView" },
          { value: "separator-2", label: "──────", disabled: true },
          { value: "other", label: "Other product..." }
        ]}
      />
    </SectionCard>
  );

  return (
    <div class="flex flex-col gap-6">
      
      {/* ── Control Deck (Viewport-tailored layouts) ── */}

      {/* 1. Mobile 1-Column Layout (< md): Collapsible cards starting collapsed */}
      <div class="flex flex-col gap-3.5 md:hidden">
        {scaleVolumeCard()}
        {operationsToolsCard()}
        {carrierMixCard()}
        {techStackCard()}
        {freightTypesCard()}
        {checkInCard()}
        {buyingContextCard()}
      </div>

      {/* 2. Tablet 2-Column Layout (md:flex xl:hidden): Buying Context bottom-left, Carrier Mix top-right */}
      <div class="hidden md:flex xl:hidden gap-5 sm:gap-6 items-start">
        <div class="flex-1 flex flex-col gap-5 sm:gap-6">
          {scaleVolumeCard()}
          {operationsToolsCard()}
          {buyingContextCard()}
        </div>
        <div class="flex-1 flex flex-col gap-5 sm:gap-6">
          {carrierMixCard()}
          {techStackCard()}
          {freightTypesCard()}
          {checkInCard()}
        </div>
      </div>

      {/* 3. Desktop 3-Column Layout (xl:flex): Clean 3-column layout starting at xl: (1280px+) */}
      <div class="hidden xl:flex gap-5 sm:gap-6 items-start">
        <div class="flex-1 flex flex-col gap-5 sm:gap-6">
          {scaleVolumeCard()}
          {operationsToolsCard()}
        </div>
        <div class="flex-1 flex flex-col gap-5 sm:gap-6">
          {carrierMixCard()}
          {techStackCard()}
          {freightTypesCard()}
        </div>
        <div class="flex-1 flex flex-col gap-5 sm:gap-6">
          {checkInCard()}
          {buyingContextCard()}
        </div>
      </div>

      {/* ── Generate Button (hidden once results are shown) ── */}
      <Show when={!showOutput()}>
        <div class="mt-4 flex flex-col items-center text-center">
          <button
            class="px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-md select-none"
            classList={{
              "bg-[#fd4f00] text-white hover:bg-[#e64700] hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5": completionScore() >= THRESHOLD,
              "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70": completionScore() < THRESHOLD
            }}
            disabled={completionScore() < THRESHOLD}
            onClick={handleReveal}
          >
            View Recommended Tools
          </button>
          <p class="mt-3 text-sm text-[#9c806d] font-sans max-w-md">
            {completionScore() >= THRESHOLD
              ? "The more detail you add, the more accurate your match will be"
              : completionScore() > 0
              ? "Add a little more operational context above to generate your results"
              : "Share what's relevant to your operation above to find your match"}
          </p>
        </div>
      </Show>

      {/* ── Recommendation Output (live-updates after reveal) ── */}
      <Show when={showOutput()}>
        <div id="recommendation-output" class="rounded-2xl border-2 border-[#fd4f00] bg-white p-6 md:p-10 shadow-lg relative overflow-hidden mt-6">
          <div class="relative z-10">
            <div class="mb-8 text-center">
              <h2 class="font-sans font-bold text-xl md:text-2xl text-black max-w-5xl mx-auto transition-all duration-300">
                {recommendedOutcome().heading}
              </h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <For each={recommendedOutcome().demos}>
                {(demo, i) => {
                  const isDataDocks = () => demo.name === "DataDocks";
                  return (
                    <div
                      onMouseEnter={() => isDataDocks() && setHoverDD(true)}
                      onMouseLeave={() => isDataDocks() && setHoverDD(false)}
                      class="flex flex-col items-center justify-center rounded-xl p-6 text-center transition-all duration-300 relative"
                      classList={{
                        "border-2 bg-white transform": isDataDocks(),
                        "border-[#fd4f00] shadow-[0_0_20px_rgba(253,79,0,0.3)] -translate-y-1": isDataDocks() && hoverDD(),
                        "border-[#fd4f00] shadow-md hover:-translate-y-1": isDataDocks() && !hoverDD(),
                        "border border-[#ece6de] bg-[#faf8f5] text-black hover:border-[#9c806d]": !isDataDocks()
                      }}
                    >
                      <div
                        class="mb-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-sm transition-colors duration-300"
                        classList={{
                          "bg-[#fd4f00] text-white": isDataDocks(),
                          "bg-white text-[#9c806d] border border-[#ece6de]": !isDataDocks()
                        }}
                      >
                        {i() + 1}
                      </div>
                      <h4 class="font-recoleta text-lg md:text-xl font-bold leading-tight mb-2 text-[#5f483a]">
                        {demo.name}
                      </h4>
                      <p class="font-sans text-sm text-gray-600 leading-snug mb-2">
                        {demo.description}
                      </p>
                    </div>
                  );
                }}
              </For>
            </div>

            <p class="mt-8 text-center text-sm md:text-base text-[#9c806d] font-sans max-w-4xl mx-auto">
              These results update as you go. The more you tell us about your operation, the more accurate the match.
            </p>

            <div 
              class="mt-8 mx-auto max-w-lg mb-4"
              onMouseEnter={() => setHoverDD(true)}
              onMouseLeave={() => setHoverDD(false)}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const email = (e.currentTarget.querySelector('input[name="email"]') as HTMLInputElement)?.value;
                  if (email) {
                    const w = window as any;
                    if (typeof w.ddSetEmail === 'function') w.ddSetEmail(email);
                    if (typeof w.bentoCall === 'function') w.bentoCall('identify', email);
                    fetch('/api/bento-track', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email,
                        event: 'Demo Subscriber',
                        source: window.location.pathname,
                        landingPage: sessionStorage.getItem('dd_landing_page') || window.location.href,
                        visitorUuid: typeof w.getBentoVisitorUuid === 'function' ? w.getBentoVisitorUuid() : null,
                        attribution: typeof w.ddGetAttribution === 'function' ? w.ddGetAttribution() : null,
                      }),
                      keepalive: true,
                    }).catch(() => {});
                  }
                  const ddOpen = (window as any).ddOpenCalendly;
                  if (typeof ddOpen === 'function') {
                    ddOpen("hide_gdpr_banner=1");
                  } else {
                    window.open("https://calendly.com/nick-rakovsky/datadocks-demo?hide_gdpr_banner=1", "_blank", "noopener");
                  }
                }}
                class="flex flex-row items-stretch gap-0 w-full rounded-none shadow-none"
              >
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your work email"
                  required
                  class="flex-1 h-12 md:h-16 px-4 md:px-6 font-recoleta font-normal text-sm md:text-xl bg-[#faf8f5] text-[#5f483a] outline-none placeholder:text-gray-400 border border-[#ece6de] border-r-0 focus:ring-0 focus:border-[#fd4f00] transition-colors duration-300"
                  classList={{ "border-[#fd4f00]": hoverDD() }}
                />
                <button
                  type="submit"
                  class="whitespace-nowrap h-12 md:h-16 text-white font-recoleta font-normal transition-colors duration-300 px-6 md:px-8 text-sm md:text-xl border-0 flex items-center justify-center gap-2"
                  classList={{
                    "bg-[#fd4f00]": hoverDD(),
                    "bg-black hover:bg-[#fd4f00]": !hoverDD()
                  }}
                >
                  Book a Demo
                  <svg class="h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </Show>
      
    </div>
  );
};

export default RequirementsExplorer;
