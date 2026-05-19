/** @jsxImportSource solid-js */
import { createSignal, createMemo, For, Show } from "solid-js";
import { cn } from "@/components/solid/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────── */
type YardShape = "square" | "l-shape" | "u-shape";
type GateLayout = "shared" | "separate";
type GateInfra = "manned" | "unmanned";
type CommMethod = "radio" | "phone" | "walkie" | "tablet" | "auto-ping";
type DispatchMethod = "whiteboard" | "radio" | "spreadsheet" | "handheld";

interface YardConfig {
  shape: YardShape;
  dockDoors: number;
  parkingStandard: number;
  parkingEmpty: number;
  parkingMaint: number;
  parkingSpecial: number;
  gateLayout: GateLayout;
  gateInfra: GateInfra;
  gateBarrier: boolean;
  dailyVolume: number;
  fleetMix: number; // 0=all private, 100=all external
  unloadStrategy: number; // 0=all live, 100=all drop
  hasReefer: boolean;
  hasFragile: boolean;
  hasSecure: boolean;
  yardSpotters: number;
  gateStaff: number;
  commMethod: CommMethod;
  dispatchMethod: DispatchMethod;
}

interface Bottleneck {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

/* ─── Defaults ──────────────────────────────────────────────────── */
const DEFAULT_CONFIG: YardConfig = {
  shape: "square",
  dockDoors: 12,
  parkingStandard: 20,
  parkingEmpty: 5,
  parkingMaint: 2,
  parkingSpecial: 3,
  gateLayout: "shared",
  gateInfra: "manned",
  gateBarrier: false,
  dailyVolume: 40,
  fleetMix: 60,
  unloadStrategy: 50,
  hasReefer: false,
  hasFragile: false,
  hasSecure: false,
  yardSpotters: 2,
  gateStaff: 1,
  commMethod: "radio",
  dispatchMethod: "whiteboard",
};

/* ─── Bottleneck Diagnosis ──────────────────────────────────────── */
function diagnose(c: YardConfig): Bottleneck[] {
  const results: Bottleneck[] = [];
  // Gate Congestion
  if (c.dailyVolume > 30 && c.gateLayout === "shared" && ["radio", "phone", "walkie"].includes(c.commMethod)) {
    results.push({
      id: "gate-congestion",
      title: "Gate Congestion",
      description: "Unscheduled arrivals and manual check-ins are choking your lot and causing street backups. With " + c.dailyVolume + " daily arrivals through a shared gate using " + c.commMethod + " communication, trucks are stacking up before they even enter.",
      severity: "high",
    });
  }
  // Yard Blindness
  if (c.unloadStrategy > 50 && (c.parkingStandard + c.parkingEmpty) > 25 && ["whiteboard", "spreadsheet"].includes(c.dispatchMethod)) {
    results.push({
      id: "yard-blindness",
      title: "Yard Blindness",
      description: "Your jockeys are wasting hours hunting for specific dropped assets across " + (c.parkingStandard + c.parkingEmpty + c.parkingMaint + c.parkingSpecial) + " parking spots. With " + c.unloadStrategy + "% drop trailers and manual dispatch via " + c.dispatchMethod + ", every move starts with a search.",
      severity: "high",
    });
  }
  // Detention Bleed
  const capacityRatio = c.dailyVolume / Math.max(c.dockDoors, 1);
  if (c.fleetMix > 50 && c.unloadStrategy < 50 && capacityRatio > 4) {
    results.push({
      id: "detention-bleed",
      title: "Carrier Detention",
      description: "You lack the dock capacity for your inbound volume. At " + c.dailyVolume + " arrivals across " + c.dockDoors + " doors with " + c.fleetMix + "% external carriers doing live unloads, detention fees are unavoidable.",
      severity: "high",
    });
  }
  // Understaffed yard
  if (c.yardSpotters < 2 && c.dailyVolume > 40 && c.unloadStrategy > 40) {
    results.push({
      id: "understaffed",
      title: "Understaffed Yard Operations",
      description: "With " + c.yardSpotters + " yard spotter" + (c.yardSpotters === 1 ? "" : "s") + " handling " + c.dailyVolume + " daily moves and " + c.unloadStrategy + "% drop trailers, your team is constantly firefighting instead of running a process.",
      severity: "medium",
    });
  }
  // No bottleneck fallback
  if (results.length === 0) {
    results.push({
      id: "optimization",
      title: "Optimization Opportunity",
      description: "Your yard layout looks manageable, but there's likely hidden time waste. Most facilities running " + c.dailyVolume + " daily loads save 2-4 hours per day with automated scheduling and real-time yard visibility.",
      severity: "low",
    });
  }
  return results;
}

/* ─── Slider Component ──────────────────────────────────────────── */
function Slider(props: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <label class="yb-slider">
      <span class="yb-slider__label">{props.label}</span>
      <div class="yb-slider__row">
        <input
          type="range"
          min={props.min}
          max={props.max}
          step={props.step ?? 1}
          value={props.value}
          onInput={(e) => props.onChange(parseInt(e.currentTarget.value))}
          class="yb-slider__input"
        />
        <span class="yb-slider__value">{props.value}{props.suffix ?? ""}</span>
      </div>
    </label>
  );
}

/* ─── Toggle Component ──────────────────────────────────────────── */
function Toggle<T extends string>(props: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div class="yb-toggle">
      <For each={props.options}>
        {(opt) => (
          <button
            type="button"
            class={cn("yb-toggle__btn", props.value === opt.value && "yb-toggle__btn--active")}
            onClick={() => props.onChange(opt.value)}
          >
            {opt.label}
          </button>
        )}
      </For>
    </div>
  );
}

/* ─── Checkbox Component ────────────────────────────────────────── */
function Check(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label class="yb-check">
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.currentTarget.checked)} class="yb-check__input" />
      <span class="yb-check__label">{props.label}</span>
    </label>
  );
}

/* ─── Section Header ────────────────────────────────────────────── */
function SectionHeader(props: { title: string; icon: string }) {
  return (
    <div class="yb-section-header">
      <span class="yb-section-header__icon">{props.icon}</span>
      <h4 class="yb-section-header__title">{props.title}</h4>
    </div>
  );
}

/* ─── Isometric Yard Renderer ───────────────────────────────────── */
function IsometricYard(props: { config: YardConfig }) {
  const totalParking = createMemo(() =>
    props.config.parkingStandard + props.config.parkingEmpty + props.config.parkingMaint + props.config.parkingSpecial
  );

  const doorCount = createMemo(() => Math.min(props.config.dockDoors, 40));
  const parkingRows = createMemo(() => Math.ceil(Math.min(totalParking(), 60) / 6));

  // Truck animation speed based on daily volume
  const animSpeed = createMemo(() => {
    const v = props.config.dailyVolume;
    if (v > 100) return "2s";
    if (v > 50) return "4s";
    return "6s";
  });

  return (
    <div class="yb-iso" id="yard-visualization">
      <div class="yb-iso__scene">
        {/* Ground plane */}
        <div class="yb-iso__ground">
          {/* Road / drive lane */}
          <div class="yb-iso__road" />

          {/* Gate */}
          <div class={cn("yb-iso__gate", props.config.gateLayout === "separate" && "yb-iso__gate--separate")}>
            <div class="yb-iso__gate-label">
              {props.config.gateLayout === "shared" ? "IN/OUT" : "IN"}
            </div>
            <Show when={props.config.gateInfra === "manned"}>
              <div class="yb-iso__guardshack" />
            </Show>
            <Show when={props.config.gateBarrier}>
              <div class="yb-iso__barrier" />
            </Show>
          </div>
          <Show when={props.config.gateLayout === "separate"}>
            <div class="yb-iso__gate yb-iso__gate--exit">
              <div class="yb-iso__gate-label">OUT</div>
              <Show when={props.config.gateInfra === "manned"}>
                <div class="yb-iso__guardshack" />
              </Show>
            </div>
          </Show>

          {/* Warehouse building */}
          <div class="yb-iso__warehouse" style={{ "--door-count": doorCount() }}>
            <div class="yb-iso__warehouse-roof">
              <span class="yb-iso__warehouse-label">WAREHOUSE</span>
            </div>
            <div class="yb-iso__warehouse-wall" />
            <div class="yb-iso__dock-row">
              <For each={Array.from({ length: doorCount() })}>
                {(_, i) => (
                  <div class={cn(
                    "yb-iso__dock-door",
                    i() < doorCount() * 0.3 && "yb-iso__dock-door--busy"
                  )}>
                    <span class="yb-iso__door-num">{i() + 1}</span>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Parking lot */}
          <div class="yb-iso__parking" style={{ "--park-rows": parkingRows() }}>
            <For each={Array.from({ length: Math.min(totalParking(), 60) })}>
              {(_, i) => {
                const type = createMemo(() => {
                  if (i() < props.config.parkingStandard) return "standard";
                  if (i() < props.config.parkingStandard + props.config.parkingEmpty) return "empty";
                  if (i() < props.config.parkingStandard + props.config.parkingEmpty + props.config.parkingMaint) return "maint";
                  return "special";
                });
                const occupied = createMemo(() => i() % 3 !== 0);
                return (
                  <div class={cn("yb-iso__spot", `yb-iso__spot--${type()}`, occupied() && "yb-iso__spot--occupied")}>
                    <Show when={occupied()}>
                      <div class={cn(
                        "yb-iso__trailer",
                        props.config.hasReefer && type() === "special" && "yb-iso__trailer--reefer"
                      )} />
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>

          {/* Animated trucks */}
          <div class="yb-iso__trucks" style={{ "--anim-speed": animSpeed() }}>
            <div class="yb-iso__truck yb-iso__truck--1">
              <div class="yb-iso__truck-cab" />
              <div class="yb-iso__truck-trailer" />
            </div>
            <div class="yb-iso__truck yb-iso__truck--2">
              <div class="yb-iso__truck-cab" />
              <div class="yb-iso__truck-trailer" />
            </div>
            <Show when={props.config.dailyVolume > 50}>
              <div class="yb-iso__truck yb-iso__truck--3">
                <div class="yb-iso__truck-cab" />
                <div class="yb-iso__truck-trailer" />
              </div>
            </Show>
          </div>

          {/* Yard spotters */}
          <Show when={props.config.yardSpotters > 0}>
            <div class="yb-iso__spotters">
              <For each={Array.from({ length: Math.min(props.config.yardSpotters, 4) })}>
                {(_, i) => (
                  <div class={cn("yb-iso__spotter", `yb-iso__spotter--${i() + 1}`)}>
                    <div class="yb-iso__spotter-vehicle" />
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>

      {/* Stats overlay */}
      <div class="yb-iso__stats">
        <div class="yb-iso__stat">
          <span class="yb-iso__stat-val">{props.config.dockDoors}</span>
          <span class="yb-iso__stat-label">Doors</span>
        </div>
        <div class="yb-iso__stat">
          <span class="yb-iso__stat-val">{totalParking()}</span>
          <span class="yb-iso__stat-label">Spots</span>
        </div>
        <div class="yb-iso__stat">
          <span class="yb-iso__stat-val">{props.config.dailyVolume}</span>
          <span class="yb-iso__stat-label">Daily</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
export default function YardBuilder() {
  const [config, setConfig] = createSignal<YardConfig>({ ...DEFAULT_CONFIG });
  const [activePanel, setActivePanel] = createSignal<"footprint" | "throughput" | "resources">("footprint");
  const [showDiagnosis, setShowDiagnosis] = createSignal(false);
  const [email, setEmail] = createSignal("");
  const [submitted, setSubmitted] = createSignal(false);

  const update = <K extends keyof YardConfig>(key: K, value: YardConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setShowDiagnosis(false);
  };

  const bottlenecks = createMemo(() => diagnose(config()));

  function handleSubmit(e: Event) {
    e.preventDefault();
    const em = email();
    if (!em) return;
    // Track with Bento
    if (typeof window !== "undefined") {
      const w = window as any;
      if (w.bento?.identify) w.bento.identify(em);
      fetch("/api/bento-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: em,
          event: "Yard Builder Lead",
          source: "/yard-management",
          landingPage: sessionStorage.getItem("dd_landing_page") || window.location.href,
          visitorUuid: w.getBentoVisitorUuid?.() ?? null,
          yardConfig: config(),
          bottlenecks: bottlenecks().map((b) => b.title),
        }),
        keepalive: true,
      }).catch(() => {});
    }
    setSubmitted(true);
  }

  return (
    <div class="yb" id="yard-builder">
      <div class="yb__layout">
        {/* ── Left: Control Panel ────────────────────────────── */}
        <div class="yb__controls">
          <div class="yb__tabs">
            <button type="button" class={cn("yb__tab", activePanel() === "footprint" && "yb__tab--active")} onClick={() => setActivePanel("footprint")}>
              <span class="yb__tab-icon">🏗️</span> Footprint
            </button>
            <button type="button" class={cn("yb__tab", activePanel() === "throughput" && "yb__tab--active")} onClick={() => setActivePanel("throughput")}>
              <span class="yb__tab-icon">🚛</span> Throughput
            </button>
            <button type="button" class={cn("yb__tab", activePanel() === "resources" && "yb__tab--active")} onClick={() => setActivePanel("resources")}>
              <span class="yb__tab-icon">👥</span> Resources
            </button>
          </div>

          <div class="yb__panel">
            {/* Footprint Panel */}
            <Show when={activePanel() === "footprint"}>
              <div class="yb__panel-content">
                <SectionHeader title="Yard Shape" icon="📐" />
                <Toggle
                  options={[
                    { label: "Square", value: "square" as YardShape },
                    { label: "L-Shape", value: "l-shape" as YardShape },
                    { label: "U-Shape", value: "u-shape" as YardShape },
                  ]}
                  value={config().shape}
                  onChange={(v) => update("shape", v)}
                />

                <SectionHeader title="Dock Doors" icon="🚪" />
                <Slider label="Number of dock doors" value={config().dockDoors} min={2} max={100} onChange={(v) => update("dockDoors", v)} />

                <SectionHeader title="Parking Allocation" icon="🅿️" />
                <Slider label="Standard Loaded" value={config().parkingStandard} min={0} max={100} onChange={(v) => update("parkingStandard", v)} />
                <Slider label="Empty" value={config().parkingEmpty} min={0} max={50} onChange={(v) => update("parkingEmpty", v)} />
                <Slider label="Maintenance" value={config().parkingMaint} min={0} max={20} onChange={(v) => update("parkingMaint", v)} />
                <Slider label="Specialized" value={config().parkingSpecial} min={0} max={30} onChange={(v) => update("parkingSpecial", v)} />

                <SectionHeader title="Gate Architecture" icon="🚧" />
                <Toggle
                  options={[
                    { label: "Shared In/Out", value: "shared" as GateLayout },
                    { label: "Separate Gates", value: "separate" as GateLayout },
                  ]}
                  value={config().gateLayout}
                  onChange={(v) => update("gateLayout", v)}
                />
                <Toggle
                  options={[
                    { label: "Manned", value: "manned" as GateInfra },
                    { label: "Unmanned", value: "unmanned" as GateInfra },
                  ]}
                  value={config().gateInfra}
                  onChange={(v) => update("gateInfra", v)}
                />
                <Check label="Physical barrier" checked={config().gateBarrier} onChange={(v) => update("gateBarrier", v)} />
              </div>
            </Show>

            {/* Throughput Panel */}
            <Show when={activePanel() === "throughput"}>
              <div class="yb__panel-content">
                <SectionHeader title="Daily Volume" icon="📊" />
                <Slider label="Truck arrivals per day" value={config().dailyVolume} min={5} max={300} step={5} onChange={(v) => update("dailyVolume", v)} />

                <SectionHeader title="Fleet Mix" icon="🚚" />
                <Slider label="External carriers" value={config().fleetMix} min={0} max={100} suffix="%" onChange={(v) => update("fleetMix", v)} />

                <SectionHeader title="Unload Strategy" icon="📦" />
                <Slider label="Drop trailers" value={config().unloadStrategy} min={0} max={100} suffix="%" onChange={(v) => update("unloadStrategy", v)} />

                <SectionHeader title="Handling Complexity" icon="❄️" />
                <Check label="Refrigerated (Reefer)" checked={config().hasReefer} onChange={(v) => update("hasReefer", v)} />
                <Check label="Fragile" checked={config().hasFragile} onChange={(v) => update("hasFragile", v)} />
                <Check label="Secure / High-Value" checked={config().hasSecure} onChange={(v) => update("hasSecure", v)} />
              </div>
            </Show>

            {/* Resources Panel */}
            <Show when={activePanel() === "resources"}>
              <div class="yb__panel-content">
                <SectionHeader title="Personnel" icon="👷" />
                <Slider label="Yard spotters / jockeys" value={config().yardSpotters} min={0} max={20} onChange={(v) => update("yardSpotters", v)} />
                <Slider label="Dedicated gate staff" value={config().gateStaff} min={0} max={10} onChange={(v) => update("gateStaff", v)} />

                <SectionHeader title="Gate-to-Dock Communication" icon="📡" />
                <Toggle
                  options={[
                    { label: "Radio", value: "radio" as CommMethod },
                    { label: "Phone", value: "phone" as CommMethod },
                    { label: "Tablet", value: "tablet" as CommMethod },
                    { label: "Auto", value: "auto-ping" as CommMethod },
                  ]}
                  value={config().commMethod}
                  onChange={(v) => update("commMethod", v)}
                />

                <SectionHeader title="Jockey Dispatch" icon="📋" />
                <Toggle
                  options={[
                    { label: "Whiteboard", value: "whiteboard" as DispatchMethod },
                    { label: "Radio", value: "radio" as DispatchMethod },
                    { label: "Sheet", value: "spreadsheet" as DispatchMethod },
                    { label: "Device", value: "handheld" as DispatchMethod },
                  ]}
                  value={config().dispatchMethod}
                  onChange={(v) => update("dispatchMethod", v)}
                />
              </div>
            </Show>
          </div>

          {/* Diagnose button */}
          <button
            type="button"
            class="yb__diagnose-btn"
            onClick={() => setShowDiagnosis(true)}
          >
            Run Bottleneck Diagnosis
          </button>
        </div>

        {/* ── Right: Isometric View ─────────────────────────── */}
        <div class="yb__view">
          <IsometricYard config={config()} />
        </div>
      </div>

      {/* ── Diagnosis Output ──────────────────────────────── */}
      <Show when={showDiagnosis()}>
        <div class="yb__diagnosis" id="yard-diagnosis">
          <h3 class="yb__diagnosis-title">Bottleneck Diagnosis</h3>
          <div class="yb__diagnosis-grid">
            <For each={bottlenecks()}>
              {(b) => (
                <div class={cn("yb__bottleneck", `yb__bottleneck--${b.severity}`)}>
                  <div class="yb__bottleneck-header">
                    <span class={cn("yb__severity-dot", `yb__severity-dot--${b.severity}`)} />
                    <h4 class="yb__bottleneck-title">{b.title}</h4>
                  </div>
                  <p class="yb__bottleneck-desc">{b.description}</p>
                </div>
              )}
            </For>
          </div>

          {/* Lead capture */}
          <Show when={!submitted()}>
            <div class="yb__capture">
              <p class="yb__capture-text">Get your custom mitigation report and system architecture recommendation.</p>
              <form class="yb__capture-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  required
                  placeholder="Enter your work email"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  class="yb__capture-input"
                />
                <button type="submit" class="yb__capture-btn">Get Report</button>
              </form>
            </div>
          </Show>
          <Show when={submitted()}>
            <div class="yb__capture yb__capture--done">
              <p class="yb__capture-text">We'll send your custom report to <strong>{email()}</strong> shortly.</p>
              <a
                href="https://calendly.com/nick-rakovsky/datadocks-demo?primary_color=FF5722"
                target="_blank"
                rel="noopener noreferrer"
                class="yb__capture-btn"
              >
                Book a walkthrough
              </a>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
