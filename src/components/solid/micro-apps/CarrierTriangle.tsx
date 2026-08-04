/** @jsxImportSource solid-js */
import { createSignal, createMemo, onCleanup, Show, For } from "solid-js";
import type { Component } from "solid-js";
import { cn } from "@/components/solid/lib/utils";

interface CarrierTriangleProps {
  parentMix: { dedicated: number; company: number; customer: number };
  childMix: { asset: number; broker: number; spot: number };
  onParentChange: (mix: { dedicated: number; company: number; customer: number }) => void;
  onChildChange: (mix: { asset: number; broker: number; spot: number }) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const H = 86.6025;
const W = 100;

// Vertices (SVG coordinate space)
const VA = { x: 50, y: 0 };      // Top
const VB = { x: 0, y: H };       // Bottom-left
const VC = { x: W, y: H };       // Bottom-right

// Colors
const COL_ORANGE = "#fd4f00";
const COL_ORANGE_DARK = "#d94400";
const COL_ORANGE_LIGHT = "#ff8c4d";
const COL_BROWN_DARK = "#5f483a";
const COL_BROWN_LIGHT = "#ece6de";
const COL_BROWN_XLIGHT = "#faf8f5";
const COL_BROWN_MED = "#9c806d";

// ── Helpers ────────────────────────────────────────────────────────────────

function baryToXY(wA: number, wB: number, wC: number) {
  return {
    x: wA * VA.x + wB * VB.x + wC * VC.x,
    y: wA * VA.y + wB * VB.y + wC * VC.y,
  };
}

function xyToBary(x: number, y: number) {
  let wA = (H - y) / H;
  let wB = (H * (x - W) - 50 * (y - H)) / -8660.25;
  let wC = 1 - wA - wB;

  if (wA < 0) { wA = 0; const s = wB + wC; if (s > 0) { wB /= s; wC /= s; } else { wB = 0.5; wC = 0.5; } }
  if (wB < 0) { wB = 0; const s = wA + wC; if (s > 0) { wA /= s; wC /= s; } else { wA = 0.5; wC = 0.5; } }
  if (wC < 0) { wC = 0; const s = wA + wB; if (s > 0) { wA /= s; wB /= s; } else { wA = 0.5; wB = 0.5; } }

  if (wA < 0) wA = 0;
  if (wB < 0) wB = 0;
  if (wC < 0) wC = 0;
  const total = wA + wB + wC;
  return { wA: wA / total, wB: wB / total, wC: wC / total };
}

// ── Component ──────────────────────────────────────────────────────────────

export const CarrierTriangle: Component<CarrierTriangleProps> = (props) => {
  let svgRef!: SVGSVGElement;

  const [isDragging, setIsDragging] = createSignal(false);
  const [activeTriangle, setActiveTriangle] = createSignal<"parent" | "child">("parent");
  
  const parentPoint = createMemo(() => baryToXY(props.parentMix.dedicated, props.parentMix.company, props.parentMix.customer));
  const childPoint = createMemo(() => baryToXY(props.childMix.asset, props.childMix.broker, props.childMix.spot));
  const inZone = () => props.parentMix.company >= 0.5;

  const handleMove = (clientX: number, clientY: number) => {
    if (!svgRef) return;
    const pt = svgRef.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgRef.getScreenCTM();
    if (!ctm) return;
    const cursorPt = pt.matrixTransform(ctm.inverse());
    const { wA, wB, wC } = xyToBary(cursorPt.x, cursorPt.y);

    if (activeTriangle() === "parent") {
      props.onParentChange({ dedicated: wA, company: wB, customer: wC });
    } else {
      props.onChildChange({ asset: wA, broker: wB, spot: wC });
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX, e.clientY);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (isDragging()) handleMove(e.clientX, e.clientY);
  };

  const onPointerUp = () => setIsDragging(false);

  if (typeof window !== "undefined") {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    onCleanup(() => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    });
  }

  // ── Labels ──


  return (
    <div class="relative w-full max-w-[300px] mx-auto mt-6 mb-6 select-none touch-none">
      
      {/* ── Back Breadcrumb ── */}
      <div 
        class={cn(
          "absolute top-[5%] left-[4.5%] z-20 transition-all duration-300",
          activeTriangle() === "child" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none -translate-x-2"
        )}
      >
        <button
          onClick={() => setActiveTriangle("parent")}
          class="text-[10px] font-bold font-recoleta bg-transparent border border-[#5f483a] text-[#5f483a] hover:bg-[#ece6de] hover:text-[#fd4f00] px-3 py-0.5 rounded-full transition-colors flex items-center gap-1 uppercase tracking-wider shadow-sm cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          BACK
        </button>
      </div>

      {/* ── Triangle Container ── */}
      <div class="relative w-full">
        
        {/* ── HTML Labels (Pushed Below Vertices to use gap) ── */}
        <div class="absolute inset-0 pointer-events-none z-10 text-[#5f483a]">
          {/* Parent Labels */}
          <div class={cn("absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]", activeTriangle() === "parent" ? "opacity-100" : "opacity-0")}>
            {/* Top Label */}
            <div class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full w-full text-center">
              <span class="text-[10px] font-bold uppercase tracking-wider leading-tight font-sans block">Dedicated Fleet</span>
            </div>
            {/* Left Label */}
            <div class="absolute left-[4.5%] bottom-0 -translate-x-[25%] translate-y-full text-left">
              <span class="text-[10px] font-bold uppercase tracking-wider leading-tight font-sans block w-28">Company-Routed Carriers</span>
            </div>
            {/* Right Label */}
            <div class="absolute right-[4.5%] bottom-0 translate-x-[25%] translate-y-full text-right">
              <span class="text-[10px] font-bold uppercase tracking-wider leading-tight font-sans block w-28">Customer/Vendor Routed</span>
            </div>
          </div>

          {/* Child Labels */}
          <div class={cn("absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]", activeTriangle() === "child" ? "opacity-100" : "opacity-0")}>
            {/* Top Label */}
            <div class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full w-full text-center">
              <span class="text-[10px] font-bold uppercase tracking-wider leading-tight font-sans block">Contract Freight</span>
            </div>
            {/* Left Label */}
            <div class="absolute left-[4.5%] bottom-0 -translate-x-[25%] translate-y-full text-left">
              <span class="text-[10px] font-bold uppercase tracking-wider leading-tight font-sans block w-28">Brokers & 3PLs</span>
            </div>
            {/* Right Label */}
            <div class="absolute right-[4.5%] bottom-0 translate-x-[25%] translate-y-full text-right">
              <span class="text-[10px] font-bold uppercase tracking-wider leading-tight font-sans block w-28">Spot Market</span>
            </div>
          </div>
        </div>

        <svg
          ref={svgRef}
          viewBox="-5 -5 110 96"
          class="w-full h-auto overflow-visible pointer-events-none"
        >
          {/* ── Parent Triangle Group ── */}
          <g 
            class={cn(
              "transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]", 
              activeTriangle() === "parent" ? "opacity-100 scale-[1]" : "opacity-0 scale-[2] pointer-events-none"
            )}
            style={{ "transform-origin": "0px 86.6px" }}
          >
            <polygon
              points={`${VA.x},${VA.y} ${VB.x},${VB.y} ${VC.x},${VC.y}`}
              fill={COL_BROWN_XLIGHT}
              stroke={COL_BROWN_LIGHT}
              stroke-width="1"
              stroke-linejoin="round"
              onPointerDown={(e) => activeTriangle() === "parent" && onPointerDown(e)}
              class={cn(
                activeTriangle() === "parent" ? "pointer-events-auto" : "pointer-events-none",
                isDragging() && activeTriangle() === "parent" ? "cursor-grabbing" : activeTriangle() === "parent" ? "cursor-grab" : ""
              )}
            />
            {/* Sub-triangle highlighting the zoom zone (Company >= 50%) */}
            <polygon
              points={`25,43.30125 0,86.6025 50,86.6025`}
              fill={COL_ORANGE}
              fill-opacity={inZone() ? "0.06" : "0"}
              class="transition-all duration-500 pointer-events-none"
            />
            {/* Median guide lines */}
            <g opacity="0.4" stroke={COL_BROWN_LIGHT} stroke-width="0.8" stroke-dasharray="2,3" class="pointer-events-none">
              <line x1={VA.x} y1={VA.y} x2={(VB.x + VC.x) / 2} y2={(VB.y + VC.y) / 2} />
              <line x1={VB.x} y1={VB.y} x2={(VA.x + VC.x) / 2} y2={(VA.y + VC.y) / 2} />
              <line x1={VC.x} y1={VC.y} x2={(VA.x + VB.x) / 2} y2={(VA.y + VB.y) / 2} />
            </g>

            {/* Drill-down trigger */}
            <g
              transform={`translate(${parentPoint().x + 5.5}, ${parentPoint().y - 5.5})`}
              style={{
                "pointer-events": activeTriangle() === "parent" && inZone() && !isDragging() ? "auto" : "none",
              }}
              class="cursor-pointer group"
              onClick={() => setActiveTriangle("child")}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <g
                style={{
                  opacity: inZone() && !isDragging() ? 1 : 0,
                  transform: `scale(${inZone() && !isDragging() ? 1 : 0.3}) rotate(${inZone() && !isDragging() ? 0 : -60}deg)`,
                  "transform-origin": "0px 0px",
                  transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                }}
              >
                <title>Drill down further</title>
                <circle cx="0" cy="0" r="5" fill="transparent" />
                <svg x="-3.5" y="-3.5" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke={COL_ORANGE} stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:stroke-[#d94400] transition-colors drop-shadow-sm pointer-events-none">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </g>
            </g>

            {/* Parent Pin */}
            <g transform={`translate(${parentPoint().x}, ${parentPoint().y})`} class="pointer-events-none">
              <circle r={isDragging() && activeTriangle() === "parent" ? 6 : 4} fill="transparent" stroke={COL_ORANGE} stroke-width="1" opacity="0.3" class="transition-all duration-200" />
              <circle r="3" fill={COL_ORANGE} />
            </g>
          </g>

          {/* ── Child Triangle Group ── */}
          <g 
            class={cn(
              "transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
              activeTriangle() === "child" ? "opacity-100 scale-[1] pointer-events-auto" : "opacity-0 scale-[0.5] pointer-events-none"
            )}
            style={{ "transform-origin": "0px 86.6px" }}
          >
            <polygon
              points={`${VA.x},${VA.y} ${VB.x},${VB.y} ${VC.x},${VC.y}`}
              fill={COL_ORANGE}
              fill-opacity="0.06"
              stroke={COL_BROWN_LIGHT}
              stroke-width="1"
              stroke-linejoin="round"
              onPointerDown={(e) => activeTriangle() === "child" && onPointerDown(e)}
              class={cn(
                activeTriangle() === "child" ? "pointer-events-auto" : "pointer-events-none",
                isDragging() && activeTriangle() === "child" ? "cursor-grabbing" : activeTriangle() === "child" ? "cursor-grab" : ""
              )}
            />
            {/* Median guide lines */}
            <g opacity="0.4" stroke={COL_BROWN_LIGHT} stroke-width="0.8" stroke-dasharray="2,3" class="pointer-events-none">
              <line x1={VA.x} y1={VA.y} x2={(VB.x + VC.x) / 2} y2={(VB.y + VC.y) / 2} />
              <line x1={VB.x} y1={VB.y} x2={(VA.x + VC.x) / 2} y2={(VA.y + VC.y) / 2} />
              <line x1={VC.x} y1={VC.y} x2={(VA.x + VB.x) / 2} y2={(VA.y + VB.y) / 2} />
            </g>

            {/* Child Pin */}
            <g transform={`translate(${childPoint().x}, ${childPoint().y})`} class="pointer-events-none">
              <circle r={isDragging() && activeTriangle() === "child" ? 6 : 4} fill="transparent" stroke="#5f483a" stroke-width="1" opacity="0.3" class="transition-all duration-200" />
              <circle r="3" fill="#5f483a" />
            </g>
          </g>
        </svg>
      </div>

      {/* ── Proportion Bar ── */}
      <ProportionBar
        parentMix={props.parentMix}
        childMix={props.childMix}
        activeTriangle={activeTriangle()}
      />
    </div>
  );
};

// ── Global Proportion Bar ────────────────────────────────────────────────

const ProportionBar: Component<{
  parentMix: { dedicated: number; company: number; customer: number };
  childMix: { asset: number; broker: number; spot: number };
  activeTriangle: "parent" | "child";
}> = (props) => {
  const isChild = () => props.activeTriangle === "child";

  const dedicatedPct = () => props.parentMix.dedicated * 100;
  const companyPct = () => props.parentMix.company * 100;
  const customerPct = () => props.parentMix.customer * 100;

  const childAssetTotalPct = () => props.childMix.asset * props.parentMix.company * 100;
  const childBrokerTotalPct = () => props.childMix.broker * props.parentMix.company * 100;
  const childSpotTotalPct = () => props.childMix.spot * props.parentMix.company * 100;

  // The segments transition very fast (75ms) so they feel glued to the pin.
  // We reorder the bar to map naturally: Company (Left), Dedicated (Middle), Customer (Right).
  return (
    <div class="mt-8 px-2 select-none">
      <div class="relative flex h-[16px] w-full overflow-hidden rounded-full bg-[#ece6de]/40">
        
        {/* ── Company Segment (Left) ── */}
        <div class="h-full relative transition-all duration-75 first:rounded-l-full" style={{ width: `${companyPct()}%` }}>
          
          {/* Parent-only view */}
          <div 
            class="h-full w-full flex items-center justify-center transition-opacity duration-300 absolute inset-0"
            style={{ "background-color": COL_ORANGE, opacity: isChild() ? 0 : 1 }}
          >
             <span class="text-[10px] font-bold text-white whitespace-nowrap transition-opacity duration-300" style={{ opacity: companyPct() > 25 && !isChild() ? 1 : 0 }}>
               Carriers {Math.round(companyPct())}%
             </span>
          </div>

          {/* Child-view subdivisions */}
          <div 
            class="h-full w-full flex transition-opacity duration-300 absolute inset-0"
            style={{ opacity: isChild() ? 1 : 0 }}
          >
            <div class="h-full flex items-center justify-center transition-all duration-75 first:rounded-l-full border-r border-white/20" style={{ width: `${props.childMix.broker * 100}%`, "background-color": COL_ORANGE_DARK }}>
              <span class="text-[10px] font-bold text-white/95 whitespace-nowrap transition-opacity duration-300" style={{ opacity: childBrokerTotalPct() > 25 ? 1 : 0 }}>
                Brokers {Math.round(childBrokerTotalPct())}%
              </span>
            </div>
            <div class="h-full flex items-center justify-center transition-all duration-75" style={{ width: `${props.childMix.asset * 100}%`, "background-color": COL_ORANGE }}>
              <span class="text-[10px] font-bold text-white whitespace-nowrap transition-opacity duration-300" style={{ opacity: childAssetTotalPct() > 28 ? 1 : 0 }}>
                Contract {Math.round(childAssetTotalPct())}%
              </span>
            </div>
            <div class="h-full flex items-center justify-center transition-all duration-75 border-l border-white/20" style={{ width: `${props.childMix.spot * 100}%`, "background-color": COL_ORANGE_LIGHT }}>
              <span class="text-[10px] font-bold text-black whitespace-nowrap transition-opacity duration-300" style={{ opacity: childSpotTotalPct() > 22 ? 1 : 0 }}>
                Spot {Math.round(childSpotTotalPct())}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Dedicated Segment (Middle) ── */}
        <div
          class="h-full flex items-center justify-center transition-all duration-75 border-l border-white/20"
          style={{ width: `${dedicatedPct()}%`, "background-color": COL_BROWN_MED }}
        >
          <span class="text-[10px] font-bold text-white whitespace-nowrap transition-opacity duration-300" style={{ opacity: dedicatedPct() > 25 ? 1 : 0 }}>
            Dedicated {Math.round(dedicatedPct())}%
          </span>
        </div>

        {/* ── Customer Segment (Right) ── */}
        <div
          class="h-full flex items-center justify-center transition-all duration-75 last:rounded-r-full border-l border-white/20"
          style={{ width: `${customerPct()}%`, "background-color": COL_BROWN_DARK }}
        >
          <span class="text-[10px] font-bold text-white/90 whitespace-nowrap transition-opacity duration-300" style={{ opacity: customerPct() > 25 ? 1 : 0 }}>
            Customer {Math.round(customerPct())}%
          </span>
        </div>

      </div>
    </div>
  );
};
