import { createSignal, createMemo } from "solid-js";

// --- State Definitions ---

export interface RequirementsState {
  // Scale & Volume
  appointmentsPerWeek: string; // '<50', '50-250', '250-500', '500+'
  dockDoors: string; // '<5', '5-15', '15-50', '50+'
  hoursPerDay: string; // '8h', '16h', '24h'
  daysPerWeek: string; // '5d', '6d', '7d'
  
  // Operations
  yardOperations: string; // 'live', 'carrier-drop', 'jockeys', 'complex'
  schedulingExpectations: string; // 'fcfs', 'day-only', 'block', 'hourly'
  currentTools: string[]; // multi-select

  // Freight
  primaryFreight: string; // 'palletized-ftl', 'ltl-small', 'other-freight'
  primaryFreightOtherSpec: string; 
  additionalFreight: string[]; // 'floor-loaded', 'reefer', 'oversized', 'container', 'palletized-ftl', 'ltl-small'
  
  // Check-in & Inspection
  checkInLocation: string; // 'guard-shack', 'shipping-office', 'self-checkin', 'yard'
  dataCapture: Record<string, string>; // doc key → timing ('pre-arrival' | 'checkin' | 'after-docking')

  // Carrier Mix
  parentCarrierMix: { dedicated: number; company: number; customer: number };
  childCarrierMix: { asset: number; broker: number; spot: number };

  // Tech Stack
  wms: string;
  wmsOther: string;
  tms: string;
  tmsOther: string;
  erp: string;
  erpOther: string;

  // Pain Points & Buying
  painPoints: string[];
  committee: string[];
  solutionsConsidering: string[];
  dedicatedProduct: string;
  dedicatedProductOther: string;
}

const initialState: RequirementsState = {
  appointmentsPerWeek: "",
  dockDoors: "",
  hoursPerDay: "",
  daysPerWeek: "",
  yardOperations: "",
  schedulingExpectations: "",
  currentTools: [],
  primaryFreight: "",
  primaryFreightOtherSpec: "",
  additionalFreight: [],
  checkInLocation: "",
  dataCapture: {},
  parentCarrierMix: { dedicated: 0.33, company: 0.34, customer: 0.33 },
  childCarrierMix: { asset: 0.33, broker: 0.34, spot: 0.33 },
  wms: "none",
  wmsOther: "",
  tms: "none",
  tmsOther: "",
  erp: "none",
  erpOther: "",
  painPoints: [],
  committee: [],
  solutionsConsidering: [],
  dedicatedProduct: "none",
  dedicatedProductOther: ""
};

export const [requirementsState, setRequirementsState] = createSignal<RequirementsState>(initialState);

export const updateRequirementsState = <K extends keyof RequirementsState>(key: K, value: RequirementsState[K]) => {
  setRequirementsState((prev) => ({ ...prev, [key]: value }));
};

// --- Engine Logic ---

export type OutcomeType = 1 | 2 | 3 | 4 | 5;

export const recommendedOutcome = createMemo<{
  type: OutcomeType;
  heading: string;
  demos: { name: string; description: string }[];
}>(() => {
  const s = requirementsState();
  
  let type: OutcomeType = 2; // Default: Mid-Size

  // ── Axis 1: Operational Scale (Continuous Bidirectional Score) ──────────────────
  let complexityScore = 0;
  
  // Volume
  if (s.appointmentsPerWeek === "<50") complexityScore -= 5;
  else if (s.appointmentsPerWeek === "250-500") complexityScore += 4;
  else if (s.appointmentsPerWeek === "500+") complexityScore += 10;
  
  if (s.dockDoors === "<5") complexityScore -= 3;
  else if (s.dockDoors === "15-50") complexityScore += 3;
  else if (s.dockDoors === "50+") complexityScore += 6;
  
  // Operating intensity
  if (s.hoursPerDay === "8h") complexityScore -= 2;
  else if (s.hoursPerDay === "16h") complexityScore += 1;
  else if (s.hoursPerDay === "24h") complexityScore += 4;
  
  if (s.daysPerWeek === "5d") complexityScore -= 2;
  else if (s.daysPerWeek === "6d") complexityScore += 1;
  else if (s.daysPerWeek === "7d") complexityScore += 3;
  
  // Yard complexity
  if (s.yardOperations === "live") complexityScore -= 2;
  else if (s.yardOperations === "carrier-drop") complexityScore += 1;
  else if (s.yardOperations === "jockeys") { complexityScore += 4; }
  else if (s.yardOperations === "complex") { complexityScore += 8; }
  
  // Scheduling precision
  if (s.schedulingExpectations === "fcfs") complexityScore -= 3;
  else if (s.schedulingExpectations === "day-only") complexityScore -= 1;
  else if (s.schedulingExpectations === "block") complexityScore += 2;
  else if (s.schedulingExpectations === "hourly") complexityScore += 5;
  
  // Check-in location
  if (s.checkInLocation === "shipping-office") complexityScore -= 1;
  else if (s.checkInLocation === "guard-shack") complexityScore += 2;
  else if (s.checkInLocation === "self-checkin") complexityScore += 4;
  
  // Data capture complexity
  const capturedDocs = Object.keys(s.dataCapture);
  if (capturedDocs.length === 0) complexityScore -= 1;
  if (capturedDocs.length >= 2) complexityScore += 2;
  if (capturedDocs.some(k => s.dataCapture[k] === "pre-arrival")) complexityScore += 3;
  
  // Tools Influencers
  const tools = s.currentTools;
  if (tools.includes("spreadsheet")) complexityScore -= 1;
  if (tools.includes("whiteboard")) complexityScore -= 1;
  if (tools.includes("email-phone")) complexityScore -= 1;
  if (tools.includes("rfid")) complexityScore += 2;
  if (tools.includes("legacy-portal")) complexityScore += 2;
  if (tools.includes("status-screen")) complexityScore += 2;

  // Freight
  if (s.primaryFreight === "palletized-ftl") complexityScore -= 1;
  if (s.additionalFreight.length > 0) {
    complexityScore += (s.additionalFreight.length * 2);
  }
  
  // Committee
  if (s.committee.includes("it")) complexityScore += 2;
  if (s.committee.includes("senior-execs")) complexityScore += 2;

  // ── Axis 2: WMS ↔ TMS Affinity (perpendicular spectrum) ──────────────────
  
  let wmsAffinity = 0;
  let tmsAffinity = 0;
  
  // WMS affinity
  if (s.wms !== "none" && s.wms !== "") wmsAffinity += 3;
  if (s.painPoints.includes("inventory")) wmsAffinity += 2;
  if (s.painPoints.includes("compliance")) wmsAffinity += 2;
  if (s.yardOperations === "complex" || s.yardOperations === "jockeys") wmsAffinity += 1;
  if (s.committee.includes("warehouse-ops")) wmsAffinity += 3;
  if (s.solutionsConsidering.includes("add-ons") && s.wms !== "none") wmsAffinity += 1;
  if (s.erp !== "none" && s.erp !== "") wmsAffinity += 1;
  
  // TMS affinity
  if (s.tms !== "none" && s.tms !== "") tmsAffinity += 3;
  if (s.painPoints.includes("detention")) tmsAffinity += 2;
  if (s.painPoints.includes("freight-availability")) tmsAffinity += 2;
  if (s.committee.includes("transportation")) tmsAffinity += 3;
  if (s.solutionsConsidering.includes("add-ons") && s.tms !== "none") tmsAffinity += 1;

  // Carrier Mix (Complexity & Affinities)
  if (s.childCarrierMix.spot > 0.33) {
    complexityScore += 1;
    tmsAffinity += 3;
  }
  if (s.childCarrierMix.broker > 0.33) {
    complexityScore += 2;
  }
  if (s.parentCarrierMix.company > 0.33) {
    complexityScore += 2;
  }
  if (s.parentCarrierMix.dedicated > 0.5) {
    complexityScore -= 3;
    tmsAffinity -= 2;
  }
  if (s.parentCarrierMix.customer > 0.33) {
    complexityScore += 2;
    tmsAffinity -= 2;
  }

  // ── Classification ────────────────────────────────────────────────────────
  if (complexityScore >= 15) {
    type = 1; // Enterprise
  } else if (wmsAffinity >= 5 && wmsAffinity > tmsAffinity + 2) {
    type = 3; // WMS-Reliant
  } else if (tmsAffinity >= 5 && tmsAffinity > wmsAffinity + 2) {
    type = 4; // TMS-Reliant
  } else if (complexityScore <= 0) {
    type = 5; // SMB
  } else {
    type = 2; // Mid-Market
  }

  // ── Vendor Recommendations ────────────────────────────────────────────────
  const demos: {name: string; description: string}[] = [];
  let ddDesc = "Agile dock scheduling built for warehouse operators.";
  
  if (type === 1) {
    ddDesc = "The most advanced system overall, with rich automations, reporting and rescheduling.";
    demos.push({ name: "C3", description: "Highly structured enterprise system, built by and for IT and governance teams." });
    
    if (s.wms !== "none") {
      const wmsName = s.wms === 'other' ? (s.wmsOther.trim() || 'WMS') : formatVendor(s.wms);
      demos.push({ name: `Your Existing WMS`, description: `Ask your ${wmsName} account manager about their preferred integration partners.` });
    } else if (s.tms !== "none") {
      const tmsName = s.tms === 'other' ? (s.tmsOther.trim() || 'TMS') : formatVendor(s.tms);
      demos.push({ name: `Your Existing TMS`, description: `Ask your ${tmsName} account manager about their preferred integration partners.` });
    } else if (s.erp !== "none") {
      const erpName = s.erp === 'other' ? (s.erpOther.trim() || 'ERP') : formatVendor(s.erp);
      demos.push({ name: `Your Existing ERP`, description: `Ask your ${erpName} account manager about their preferred integration partners.` });
    } else {
      demos.push({ name: "Conduit", description: "Mid-weight dock scheduling system with strong multi-site management workflows" });
    }
  } 
  else if (type === 2) {
    ddDesc = "The most flexible and customizable dock scheduling platform. Built by and for operations teams.";
    demos.push({ name: "GoRamp", description: "Mid weight dock scheduling system, strong on gate management and recurring appointments" });
    demos.push({ name: "C3", description: "Database-oriented system with strict governance rules. Great for heavy industry and IT-led operations" });
  } 
  else if (type === 3) {
    ddDesc = "Dock Scheduling built by and for operations teams. Integrates seamlessly with your WMS";
    demos.push({ name: "GoRamp", description: "Standalone, mid-weight dock scheduling with an intuitive interface and API integrations." });
    
    if (s.wms === "extensiv") {
      demos.push({ name: "Your Existing WMS", description: "Talk to your Extensiv account manager about their custom-built DataDocks integration!" });
    } else if (s.wms !== "none") {
      const wmsName = s.wms === 'other' ? (s.wmsOther.trim() || 'WMS') : formatVendor(s.wms);
      demos.push({ name: "Your Existing WMS", description: `Ask your ${wmsName} account manager about their preferred integration partners.` });
    } else {
      demos.push({ name: "Your Existing WMS", description: `Ask your WMS account manager about their preferred integration partners.` });
    }
  } 
  else if (type === 4) {
    ddDesc = "Dock Scheduling built by and for logistics teams. Integrates seamlessly with your TMS.";
    demos.push({ name: "project44 / FourKites", description: "Freight Visibility Platforms with basic dock-scheduling built-in." });
    
    if (s.tms !== "none") {
      const tmsName = s.tms === 'other' ? (s.tmsOther.trim() || 'TMS') : formatVendor(s.tms);
      demos.push({ name: "Your Existing TMS", description: `Ask your ${tmsName} account manager about their preferred integration partners.` });
    } else {
      demos.push({ name: "Your Existing TMS", description: `Ask your TMS account manager about their preferred integration partners.` });
    }
  } 
  else if (type === 5) {
    ddDesc = "Dock Scheduling tool that starts simple and scales as you grow.";
    demos.push({ name: "LoadingCalendar", description: "Lightweight and affordable calendar tool for small ops." });
    demos.push({ name: "Arrivy", description: "Scheduling system for field service businesses and last mile deliveries." });
  }

  // Output Headings
  const headings: Record<OutcomeType, string> = {
    1: "You need enterprise-grade dock scheduling and yard management software.",
    2: "You need a mix of automation and an intuitive interface for user adoption.",
    3: "Your WMS is at the heart of your operations, but your dock may have outgrown it.",
    4: "Your TMS is at the heart of your operations, but your dock may have outgrown it.",
    5: "You need an easy-to-learn solution to get up and running quickly."
  };

  if (type !== 1 && s.dedicatedProduct !== "none" && s.dedicatedProduct !== "datadocks") {
     const pName = s.dedicatedProduct === "other" && s.dedicatedProductOther.trim() !== "" ? s.dedicatedProductOther : formatVendor(s.dedicatedProduct);
     demos[2] = { name: pName, description: "Your specified dedicated product of interest." };
  } else if (!demos[2]) {
     demos[2] = { name: "DataDocks", description: ddDesc };
  }

  // Ensure DataDocks is always in the first position
  const dataDocksIndex = demos.findIndex(d => d.name === "DataDocks");
  if (dataDocksIndex > 0) {
    const dd = demos.splice(dataDocksIndex, 1)[0];
    dd.description = ddDesc;
    demos.unshift(dd);
  } else if (dataDocksIndex === -1) {
    demos.unshift({ name: "DataDocks", description: ddDesc });
  }
  
  // Trim to exactly 3 demos
  demos.length = 3;

  return {
    type,
    heading: headings[type],
    demos
  };
});

export const completionScore = createMemo(() => {
  let score = 0;
  const s = requirementsState();

  // High-value questions
  if (s.appointmentsPerWeek) score += 18;
  if (s.dockDoors) score += 18;
  if (s.yardOperations) score += 16;
  if (s.schedulingExpectations) score += 16;

  // Mid-value (Operating Hours combined max 18)
  let opHours = 0;
  if (s.hoursPerDay) opHours += 12;
  if (s.daysPerWeek) opHours += 12;
  score += Math.min(opHours, 18);

  if (s.checkInLocation) score += 12;

  // Pain points (+12, +8, +4, +2)
  const painPts = [12, 8, 4, 2];
  for (let i = 0; i < s.painPoints.length && i < painPts.length; i++) {
    score += painPts[i];
  }

  // Core Tech Stack
  if (s.wms !== "none" && s.wms !== "") score += 10;
  if (s.tms !== "none" && s.tms !== "") score += 10;
  if (s.erp !== "none" && s.erp !== "") score += 3;

  // Primary Freight
  if (s.primaryFreight) score += 8;

  // Additional Load Types (+4, +2, +1)
  const addFreightPts = [4, 2, 1];
  for (let i = 0; i < s.additionalFreight.length && i < addFreightPts.length; i++) {
    score += addFreightPts[i];
  }

  // Data Capture (+8, +4, +2)
  const dataCapPts = [8, 4, 2];
  const numDataCap = Object.keys(s.dataCapture).length;
  for (let i = 0; i < numDataCap && i < dataCapPts.length; i++) {
    score += dataCapPts[i];
  }

  // Buying Committee (+8, +4, +2)
  const commPts = [8, 4, 2];
  for (let i = 0; i < s.committee.length && i < commPts.length; i++) {
    score += commPts[i];
  }

  // Tools Used Today (+6, +4, +2, +1)
  const toolsPts = [6, 4, 2, 1];
  for (let i = 0; i < s.currentTools.length && i < toolsPts.length; i++) {
    score += toolsPts[i];
  }

  // Solutions / Dedicated Product (Max 6)
  if (s.dedicatedProduct !== "none" && s.dedicatedProduct !== "") {
    score += 6;
  } else if (s.solutionsConsidering.length > 0) {
    score += 4;
  }

  // Carrier Mix Distance from Center (>5% deviation)
  const getDev = (mix: Record<string, number>) => Math.max(...Object.values(mix).map(v => Math.abs(v - 1/3)));
  if (getDev(s.parentCarrierMix) > 0.05) score += 6;
  if (getDev(s.childCarrierMix) > 0.05) score += 4;

  return score;
});

function formatVendor(key: string): string {
  const map: Record<string, string> = {
    'manhattan': 'Manhattan Associates',
    'blue-yonder': 'Blue Yonder',
    'mercurygate': 'MercuryGate',
    'oracle': 'Oracle',
    'transplace': 'Transplace',
    'netsuite': 'NetSuite',
    'c3': 'C3 Solutions',
    'opendock': 'Opendock',
    'goramp': 'GoRamp',
    'project44': 'Project44',
    'conduit': 'Conduit',
    'loadingcalendar': 'LoadingCalendar',
    'prodocks': 'ProDocks',
    'timify': 'TIMIFY',
    'arrivy': 'Arrivy',
    'transporeon': 'Transporeon',
    'alpega': 'Alpega'
  };
  return map[key] || key;
}
