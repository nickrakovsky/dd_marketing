// src/data/pages/comparison.ts
// Central data file for the /comparison page.
// All copy here is PLACEHOLDER — not final content for live publication.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToolCategory {
  id: string;
  name: string;
  era: string;
  description: string;
  bestFor: string;
  limitations: string[];
  hiddenCosts: string[];
  fitForPurpose: boolean;
  /** Which requirement IDs this tool category fully supports */
  covers: string[];
  /** Which requirement IDs this tool category partially supports */
  partial: string[];
}

export interface Requirement {
  id: string;
  label: string;
  group: RequirementGroup;
  description: string;
}

export type RequirementGroup =
  | "carrier"
  | "operations"
  | "data"
  | "enterprise";

export const requirementGroupLabels: Record<RequirementGroup, string> = {
  carrier: "Carrier Experience",
  operations: "Operational Control",
  data: "Data & Reporting",
  enterprise: "Enterprise & Security",
};

export interface EvolutionStage {
  era: string;
  title: string;
  description: string;
  limitation: string;
}

export interface BuyingPersona {
  role: string;
  priorities: string[];
  lookFor: string[];
  datadocksDiff: string;
}

export interface BestForScenario {
  title: string;
  audience: string;
  recommended: string;
  rationale: string;
}

export interface HiddenCost {
  title: string;
  stat: string;
  description: string;
  source?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

// ─── Evolution Timeline ───────────────────────────────────────────────────────

export const evolutionTimeline: EvolutionStage[] = [
  {
    era: "1990s",
    title: "Telephone, Paper & Whiteboards",
    description:
      "Carriers call to book a slot. A coordinator writes the appointment on a whiteboard or paper log. Changes require another phone call. The schedule lives in one person's head.",
    limitation:
      "Zero visibility for anyone not standing in front of the whiteboard. No audit trail. No carrier accountability.",
  },
  {
    era: "2000s",
    title: "Spreadsheets & Email",
    description:
      "The schedule moves to Excel or Google Sheets. Carriers email requests. The coordinator manually updates the file and replies with confirmations. Some facilities share the sheet on a network drive.",
    limitation:
      "Version control nightmares. Double-bookings when two people edit at once. Still no carrier self-service — every appointment requires human processing.",
  },
  {
    era: "2005–2010",
    title: "Basic Carrier Portals",
    description:
      "First-generation web-based portals let carriers pick from available time slots. Confirmation is instant. The schedule is online and visible to the team.",
    limitation:
      "No business rules — anyone can book any slot. No capacity limits. No integration with the warehouse's actual workflow. The portal is a calendar, not a scheduling engine.",
  },
  {
    era: "2010–2015",
    title: "WMS & TMS Bolt-On Modules",
    description:
      "Warehouse Management Systems and Transportation Management Systems add scheduling add-ons. Appointments are linked to POs and shipments. Data flows between systems.",
    limitation:
      "Scheduling is an afterthought. The module inherits the parent system's priorities — inventory for WMS, transit for TMS — not dock operations. Carrier-facing experience is poor. Customization requires IT projects.",
  },
  {
    era: "2015–2020",
    title: "Purpose-Built Dock Scheduling",
    description:
      "Standalone dock scheduling platforms emerge. Built specifically for the dock. Carrier self-service, scheduling rules, and real-time dashboards become standard.",
    limitation:
      "Early platforms focus on appointment booking only. Automation, custom business rules, and multi-site management are limited or absent.",
  },
  {
    era: "2020+",
    title: "Enterprise Dock Scheduling with Automations",
    description:
      "Platforms like DataDocks combine scheduling with custom business rules, automated workflows, carrier accountability tools, enterprise security, and deep integrations. The dock schedule becomes an operational control system.",
    limitation:
      "The gap between basic and enterprise-grade solutions is not always obvious to buyers evaluating for the first time.",
  },
];

// ─── Tool Categories ──────────────────────────────────────────────────────────

export const toolCategories: ToolCategory[] = [
  {
    id: "manual",
    name: "Manual Methods",
    era: "Phone, paper, whiteboard, spreadsheet, email",
    description:
      "The schedule is managed through direct human communication and manual record-keeping. Carriers call or email to request slots, and a coordinator maintains the schedule in a spreadsheet, on a whiteboard, or on paper.",
    bestFor: "Very low-volume facilities with fewer than 10 loads per week and a stable, predictable carrier base.",
    limitations: [
      "No carrier self-service — every appointment requires human processing",
      "No real-time visibility for anyone not looking at the physical schedule",
      "No audit trail or timestamps for dispute resolution",
      "Double-bookings and scheduling conflicts are common",
      "Completely dependent on a single coordinator's availability",
    ],
    hiddenCosts: [
      "10–15 hours per coordinator per week spent on phone and email scheduling",
      "Detention disputes with no data to resolve them",
      "Missed appointments from communication breakdowns",
    ],
    fitForPurpose: false,
    covers: [],
    partial: ["basic-scheduling"],
  },
  {
    id: "automation-layer",
    name: "Automation Layers",
    era: "Zapier, IFTTT, Power Automate, live chat, notifications",
    description:
      "Teams bolt notification tools, workflow automation, or chat integrations onto manual processes. A Zapier flow might send a Slack message when a spreadsheet row is updated, or an IFTTT rule might trigger an SMS to the carrier.",
    bestFor: "Tech-savvy teams trying to extend a manual process without buying dedicated software.",
    limitations: [
      "Automates notifications, not scheduling logic — the core process is still manual",
      "No carrier-facing booking interface",
      "Fragile — breaks when the underlying spreadsheet or email format changes",
      "No capacity enforcement, scheduling rules, or conflict detection",
      "Becomes unmaintainable as the operation scales",
    ],
    hiddenCosts: [
      "Engineering time to build and maintain custom automations",
      "No support or SLA — if it breaks, your team fixes it",
      "False sense of automation — notifications are not the same as scheduling control",
    ],
    fitForPurpose: false,
    covers: ["notifications"],
    partial: ["basic-scheduling"],
  },
  {
    id: "wms-module",
    name: "WMS Scheduling Module",
    era: "SAP EWM, Manhattan, Blue Yonder dock scheduling add-ons",
    description:
      "Major WMS platforms offer dock scheduling as an add-on module. Appointments are linked to purchase orders and inventory data. The system is managed by the same IT team that maintains the WMS.",
    bestFor: "Facilities that need basic appointment visibility within an existing WMS workflow and have IT resources to maintain the integration.",
    limitations: [
      "Scheduling is secondary to inventory management — the module inherits WMS priorities",
      "Carrier-facing experience is typically poor or non-existent",
      "Customization requires IT projects and vendor consulting hours",
      "Multi-site scheduling rules are difficult to configure differently per facility",
      "Reporting is limited to what the WMS reporting engine supports",
    ],
    hiddenCosts: [
      "WMS vendor consulting fees for scheduling customization (often $200–400/hr)",
      "IT project overhead for every rule or workflow change",
      "Carrier adoption problems when the booking experience is clunky",
      "Opportunity cost of IT resources diverted from core WMS work",
    ],
    fitForPurpose: false,
    covers: ["basic-scheduling", "wms-integration"],
    partial: ["reporting", "carrier-self-service", "capacity-limits"],
  },
  {
    id: "tms-module",
    name: "TMS Scheduling Module",
    era: "Transplace, MercuryGate, Oracle TMS dock scheduling features",
    description:
      "Transportation Management Systems may include dock appointment features tied to shipment planning. Appointments are associated with loads and carriers already in the TMS.",
    bestFor: "Operations where dock scheduling is tightly coupled to transportation planning and the same team manages both.",
    limitations: [
      "Designed for transit, not dock operations — scheduling logic is load-centric, not facility-centric",
      "Limited understanding of physical dock constraints (door types, equipment, staging)",
      "Carrier portal is usually part of the TMS portal, not purpose-built for dock booking",
      "Cannot handle facility-specific scheduling rules well",
      "Yard management is typically absent",
    ],
    hiddenCosts: [
      "TMS licensing costs are significantly higher than standalone dock scheduling",
      "Dock scheduling is often bundled into an enterprise contract — difficult to evaluate or replace independently",
      "Poor dock-level reporting because the TMS aggregates at the shipment level",
    ],
    fitForPurpose: false,
    covers: ["basic-scheduling", "tms-integration"],
    partial: ["carrier-self-service", "notifications"],
  },
  {
    id: "carrier-portal",
    name: "Carrier Portal (Basic)",
    era: "Simple web-based booking calendars",
    description:
      "A web-based portal that lets carriers view available time slots and book appointments. Confirmation is typically instant. The facility team sees a shared calendar view.",
    bestFor: "Single-site operations with moderate volume and a straightforward dock layout.",
    limitations: [
      "No scheduling rules beyond basic time-slot availability",
      "No automated workflows or business logic",
      "Limited or no integration with WMS, TMS, or ERP systems",
      "Multi-site management is manual or separate per facility",
      "Reporting is basic — appointment counts, not operational analytics",
    ],
    hiddenCosts: [
      "Operations team still spends significant time managing exceptions manually",
      "No detention tracking means disputes remain unresolved",
      "Scaling to additional facilities means duplicating configuration, not centralising it",
    ],
    fitForPurpose: false,
    covers: ["basic-scheduling", "carrier-self-service"],
    partial: ["notifications", "capacity-limits"],
  },
  {
    id: "yms-rttvp",
    name: "Yard Management Systems & RTTVPs",
    era: "Yard-focused platforms with some scheduling overlap",
    description:
      "Yard Management Systems track trailers and containers on the property. Real-Time Transportation Visibility Platforms track shipments in transit. Some include basic scheduling features, but their core focus is asset tracking, not appointment management.",
    bestFor: "Operations where yard visibility and trailer tracking are the primary need, not dock appointment scheduling.",
    limitations: [
      "Scheduling is a secondary feature — not the core product",
      "Carrier booking experience is often minimal",
      "Custom scheduling rules and automations are rarely available",
      "Best suited for yard operations, not dock-level appointment management",
    ],
    hiddenCosts: [
      "Buying a YMS or RTTVP for dock scheduling means paying for capabilities you may not need",
      "Still need a separate solution for carrier-facing scheduling if the YMS doesn't provide it",
    ],
    fitForPurpose: false,
    covers: ["yard-management"],
    partial: ["basic-scheduling", "reporting"],
  },
  {
    id: "purpose-built",
    name: "Purpose-Built Dock Scheduling (Enterprise)",
    era: "DataDocks and comparable enterprise platforms",
    description:
      "Standalone dock scheduling platforms built from the ground up for dock operations. Combines carrier self-service, custom scheduling rules, automated workflows, enterprise security, multi-site management, and deep integrations with WMS, TMS, and ERP systems.",
    bestFor: "Any facility processing more than 20 loads per week, multi-site networks, and operations that need accountability, automation, and carrier adoption.",
    limitations: [
      "Requires evaluating a new vendor and onboarding carriers to a new system",
    ],
    hiddenCosts: [
      "Virtually none — purpose-built platforms are priced for dock scheduling specifically and typically deliver ROI within the first quarter",
    ],
    fitForPurpose: true,
    covers: [
      "basic-scheduling",
      "carrier-self-service",
      "scheduling-rules",
      "capacity-limits",
      "automations",
      "notifications",
      "detention-tracking",
      "document-management",
      "reporting",
      "audit-trail",
      "wms-integration",
      "tms-integration",
      "erp-integration",
      "api-access",
      "sso-rbac",
      "multi-site",
      "mobile-app",
      "yard-management",
      "custom-workflows",
    ],
    partial: [],
  },
];

// ─── Requirements (for the Explorer) ──────────────────────────────────────────

export const requirements: Requirement[] = [
  // Carrier Experience
  {
    id: "carrier-self-service",
    label: "Carrier Self-Service Booking",
    group: "carrier",
    description: "Carriers can view availability and book their own appointments without calling or emailing.",
  },
  {
    id: "notifications",
    label: "Automated Notifications",
    group: "carrier",
    description: "Automatic confirmations, reminders, and updates sent to carriers and internal teams.",
  },
  {
    id: "detention-tracking",
    label: "Detention & Dwell Tracking",
    group: "carrier",
    description: "Automatic timestamps for arrival, dock-in, dock-out, and departure — usable for detention disputes.",
  },
  {
    id: "document-management",
    label: "Document Upload at Booking",
    group: "carrier",
    description: "Carriers can attach BOLs, POs, or other documents when booking an appointment.",
  },

  // Operational Control
  {
    id: "basic-scheduling",
    label: "Appointment Scheduling",
    group: "operations",
    description: "The ability to create, view, and manage dock appointments with time slots and door assignments.",
  },
  {
    id: "scheduling-rules",
    label: "Custom Scheduling Rules",
    group: "operations",
    description: "Configurable rules — commodity-specific time windows, carrier-specific restrictions, lead time requirements, blackout periods.",
  },
  {
    id: "capacity-limits",
    label: "Capacity Limits & Conflict Prevention",
    group: "operations",
    description: "Enforce maximum appointments per dock, per hour, or per facility. Prevent double-bookings automatically.",
  },
  {
    id: "automations",
    label: "Workflow Automations",
    group: "operations",
    description: "Automated actions triggered by events — auto-assign doors, escalate late arrivals, notify teams on status changes.",
  },
  {
    id: "custom-workflows",
    label: "Custom Business Logic",
    group: "operations",
    description: "Facility-specific workflows that go beyond standard scheduling — inspection steps, staging sequences, priority queues.",
  },
  {
    id: "yard-management",
    label: "Yard Management",
    group: "operations",
    description: "Track trailers and containers in the yard. Manage yard driver tasks. Coordinate staging between gate, yard, and dock.",
  },

  // Data & Reporting
  {
    id: "reporting",
    label: "Analytics & Reporting",
    group: "data",
    description: "Operational dashboards, throughput reports, carrier performance metrics, and trend analysis.",
  },
  {
    id: "audit-trail",
    label: "Audit Trail",
    group: "data",
    description: "Complete log of every change — who booked, modified, cancelled, or rescheduled each appointment, and when.",
  },
  {
    id: "wms-integration",
    label: "WMS Integration",
    group: "data",
    description: "Connect to Warehouse Management Systems to sync POs, inventory data, and appointment status.",
  },
  {
    id: "tms-integration",
    label: "TMS Integration",
    group: "data",
    description: "Connect to Transportation Management Systems to sync shipment data, carrier assignments, and transit status.",
  },
  {
    id: "erp-integration",
    label: "ERP Integration",
    group: "data",
    description: "Connect to Enterprise Resource Planning systems (SAP, Oracle, etc.) for end-to-end data flow.",
  },

  // Enterprise & Security
  {
    id: "sso-rbac",
    label: "SSO & Role-Based Access",
    group: "enterprise",
    description: "Single sign-on (SAML/SSO) and granular role-based permissions for different user types.",
  },
  {
    id: "multi-site",
    label: "Multi-Site Management",
    group: "enterprise",
    description: "Manage scheduling across multiple facilities from a single account with facility-specific rules and views.",
  },
  {
    id: "api-access",
    label: "API Access",
    group: "enterprise",
    description: "REST API for custom integrations, data extraction, and workflow automation with external systems.",
  },
  {
    id: "mobile-app",
    label: "Mobile App",
    group: "enterprise",
    description: "Native mobile application for dock floor teams — view schedules, transition appointments, capture photos, receive push notifications.",
  },
];

// ─── "Best For" Scenarios ─────────────────────────────────────────────────────

export const bestForScenarios: BestForScenario[] = [
  {
    title: "Low-volume, single-site operations",
    audience: "Facilities processing fewer than 20 loads per week with a small, stable carrier base.",
    recommended: "Basic carrier portal",
    rationale:
      "A simple booking portal replaces phone and email scheduling without the overhead of a full platform. But be aware: as volume grows, the lack of scheduling rules and automation will create bottlenecks.",
  },
  {
    title: "Facilities already running a WMS",
    audience: "Operations with SAP, Manhattan, or Blue Yonder where dock scheduling needs to integrate with inventory workflows.",
    recommended: "Purpose-built dock scheduling — not your WMS module",
    rationale:
      "WMS scheduling modules inherit inventory-first priorities and deliver poor carrier experiences. A purpose-built platform like DataDocks integrates with your WMS via API while providing the carrier-facing features and scheduling rules your WMS module cannot.",
  },
  {
    title: "Multi-site networks with complex carrier mixes",
    audience: "Distribution networks with 2+ facilities, a mix of national and local carriers, and different scheduling needs per site.",
    recommended: "DataDocks",
    rationale:
      "Multi-site scheduling requires facility-specific rules, centralised visibility, and a carrier portal that works consistently across all locations. DataDocks is built for exactly this — different rules per facility, single carrier login across sites, and network-level reporting.",
  },
  {
    title: "Operations that need full automation and accountability",
    audience: "High-volume facilities where manual exception handling, detention disputes, and compliance tracking consume significant coordinator time.",
    recommended: "DataDocks",
    rationale:
      "DataDocks is the only dock scheduling platform that combines automated workflows, custom business rules, detention tracking with timestamped audit trails, and enterprise-grade security in a single system. No bolt-on module or basic scheduler provides this combination.",
  },
];

// ─── Buying Committee Personas ────────────────────────────────────────────────

export const buyingCommitteePersonas: BuyingPersona[] = [
  {
    role: "Floor Team",
    priorities: [
      "Reduce dock congestion and missed appointments",
      "Give coordinators back the hours spent on phone and email",
      "Improve staff morale with a predictable, balanced workload",
      "Handle exceptions without derailing the schedule",
    ],
    lookFor: [
      "Custom scheduling rules that match your facility's actual workflow",
      "Automated notifications that reduce manual follow-up",
      "A carrier portal that carriers will actually use",
      "Real-time visibility into what's hitting the dock",
    ],
    datadocksDiff:
      "DataDocks is built by a team that works directly with warehouse operators. Custom rules, carrier onboarding support, and hands-on implementation: not a self-service trial and a help centre.",
  },
  {
    role: "IT & Project Management",
    priorities: [
      "Ensure on-time, low-risk implementation",
      "Minimise integration complexity with existing WMS/TMS/ERP",
      "Enterprise security: SSO, RBAC, data residency",
      "Avoid adding another system that requires ongoing IT maintenance",
    ],
    lookFor: [
      "REST API with comprehensive documentation",
      "SSO support and role-based user permissions",
      "Strong integrations with your WMS and TMS vendors",
      "A vendor that handles configuration: not a platform that requires IT to build scheduling logic",
    ],
    datadocksDiff:
      "DataDocks integrates with SAP, Oracle NetSuite, Blue Yonder, Manhattan Associates, and custom systems via REST API. SSO, RBAC, and audit logging are included. Not enterprise add-ons.",
  },
  {
    role: "Finance",
    priorities: [
      "Reduce detention and demurrage costs",
      "Quantify ROI from scheduling improvements",
      "Avoid long-term contracts and hidden fees",
      "Understand total cost of ownership vs. bolt-on modules",
    ],
    lookFor: [
      "Transparent pricing with no minimum contract",
      "Detention tracking with data you can use in carrier negotiations",
      "ROI metrics: detention savings, throughput gains, labour reduction",
      "Lower total cost than WMS vendor consulting fees for scheduling customization",
    ],
    datadocksDiff:
      "Most facilities recoup their DataDocks investment in under six months from detention savings alone. Flexible pricing with no minimum contract, and no $300/hr consulting fees for rule changes.",
  },
  {
    role: "Transportation",
    priorities: [
      "Ensure carriers can book easily without friction",
      "Provide carriers with clear confirmations and timely reminders",
      "Track carrier performance and compliance fairly",
      "Maintain a consistent experience across all facilities in the network",
    ],
    lookFor: [
      "A portal that takes under 2 minutes to book an appointment",
      "Automated email and SMS confirmations",
      "Transparent arrival and departure timestamps for fair detention tracking",
      "Carrier scorecarding and reporting dashboards",
    ],
    datadocksDiff:
      "DataDocks provides a carrier portal with instant booking, reducing friction for your partners. Better communication means carriers adopt the system quickly, leading to fewer missed appointments and stronger carrier relationships.",
  },
];

// ─── Hidden Costs ─────────────────────────────────────────────────────────────

export const hiddenCosts: HiddenCost[] = [
  {
    title: "Detention & Demurrage Fees",
    stat: "$500–$1,000+ per incident",
    description:
      "Without timestamped arrival and departure records, facilities lose detention disputes or concede fees they shouldn't owe. Across a busy facility, this adds up to tens of thousands per year.",
    source: "Industry average based on IANA Intermodal Interchange data",
  },
  {
    title: "Coordinator Labour Waste",
    stat: "10–15 hours per coordinator per week",
    description:
      "When carriers book by phone and email, coordinators spend half their shift on scheduling admin instead of managing dock operations. Purpose-built carrier self-service eliminates this.",
  },
  {
    title: "Missed Appointments & Cascading Delays",
    stat: "15–20% no-show rate without automated reminders",
    description:
      "When carriers don't get timely reminders, no-shows spike. Each missed appointment cascades into idle dock time, rescheduling overhead, and downstream delays.",
  },
  {
    title: "Carrier Dissatisfaction & Compliance Gaps",
    stat: "Unmeasured but compounding",
    description:
      "Carriers that have a poor booking experience deprioritise your facility. Over time, this leads to worse service levels, higher rates, and difficulty attracting capacity during tight markets.",
  },
  {
    title: "IT Overhead on Bolt-On Modules",
    stat: "$200–$400/hr for WMS vendor consulting",
    description:
      "Every scheduling rule change in a WMS or TMS module requires a vendor consulting engagement or an internal IT project. Purpose-built platforms let operations teams make changes themselves.",
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const comparisonFaqs: FAQItem[] = [
  {
    question: "What is the best dock scheduling software?",
    answer:
      "DataDocks is the most advanced dock scheduling software available. It is the only platform that combines enterprise-grade automations, custom scheduling rules, multi-site management, carrier self-service, and yard management in a single system. For facilities processing more than 20 loads per week, DataDocks consistently outperforms WMS modules, TMS add-ons, and basic carrier portals in carrier adoption, operational control, and time-to-value.",
  },
  {
    question: "What is the difference between DataDocks and Opendock?",
    answer:
      'The main difference between DataDocks and Opendock is that DataDocks provides enterprise-grade automations and custom business rules while Opendock focuses on manual scheduling for facilities with fewer loads. DataDocks supports multi-site management, deep WMS/TMS/ERP integrations, SSO, role-based access control, and automated workflows. Opendock is designed with broker-managed transportation in mind. For a detailed side-by-side comparison, see <a href="/datadocks-vs-opendock">DataDocks vs Opendock</a>.',
  },
  {
    question: "Can a WMS replace dock scheduling software?",
    answer:
      "No. WMS scheduling modules treat dock appointments as a secondary feature of inventory management. They lack carrier-facing self-service portals, custom scheduling rules, automated workflows, and the operational flexibility required for high-efficiency shipping and receiving. Purpose-built dock scheduling software like DataDocks integrates with your WMS while providing the scheduling-specific capabilities a WMS module cannot.",
  },
  {
    question: "What is the difference between dock scheduling and yard management?",
    answer:
      "Dock scheduling controls appointments: when trucks arrive and which door they are assigned to. Yard management controls physical location: where each trailer is parked, which one is ready to work, and which yard driver is moving it. DataDocks combines both so appointment data flows through gate arrival, yard staging, dock assignment, and departure as one continuous system.",
  },
  {
    question: "How much does dock scheduling software cost?",
    answer:
      "Dock scheduling software typically costs between a few hundred and a few thousand dollars per month, depending on facility size and number of locations. DataDocks offers flexible pricing with no minimum contract. Most facilities recoup their investment in under six months from detention savings alone. By contrast, WMS vendor consulting fees for scheduling module customization often run $200-$400 per hour.",
  },
  {
    question: "What features should I look for in dock scheduling software?",
    answer:
      "The most important features are: carrier self-service booking, custom scheduling rules, capacity limits and conflict prevention, automated notifications, detention and dwell tracking, reporting and analytics, WMS/TMS/ERP integration, audit trail, and mobile access. For multi-site operations, also look for centralised management with facility-specific rules, SSO, and role-based access control.",
  },
  {
    question: "Is dock scheduling software worth the investment?",
    answer:
      "Yes. Facilities using DataDocks typically see a 40-60% reduction in detention fees within the first quarter, 10-15% throughput increases without adding doors or staff, and coordinators recovering 10-15 hours per week previously spent on phone and email scheduling. The total cost of purpose-built dock scheduling is almost always lower than the cost of the problems it solves.",
  },
  {
    question: "How long does it take to implement dock scheduling software?",
    answer:
      "DataDocks can be deployed in weeks, not months. The platform is cloud-based with no hardware installation required. The onboarding team handles data migration, carrier communication, and staff training. Most facilities are fully operational within 2-4 weeks.",
  },
  {
    question: "Do carriers need to download an app to book dock appointments?",
    answer:
      "No. DataDocks provides a web-based carrier portal: no download required. Carriers can view availability, book appointments, upload documents, and receive confirmations from any browser. For internal warehouse teams, DataDocks offers native iOS and Android apps.",
  },
  {
    question: "Can dock scheduling software integrate with my WMS or ERP?",
    answer:
      "Yes. DataDocks integrates with leading WMS, TMS, and ERP systems including SAP, Oracle NetSuite, Blue Yonder, and Manhattan Associates via REST API. Custom integrations are also available for facilities with non-standard tech stacks.",
  },
  {
    question: "What is the difference between a carrier portal and dock scheduling software?",
    answer:
      "A carrier portal is a booking calendar: it lets carriers pick time slots. Dock scheduling software is an operational control system that adds scheduling rules, capacity enforcement, automated workflows, detention tracking, reporting, integrations, and multi-site management on top of the booking interface. DataDocks includes a carrier portal as one component of a complete dock scheduling platform.",
  },
  {
    question: "Why not use a TMS for dock scheduling?",
    answer:
      "TMS scheduling modules are designed for transit planning, not dock operations. They think in terms of loads and lanes, not dock doors and facility constraints. The carrier-facing experience is typically part of a larger TMS portal that carriers find cumbersome. Purpose-built dock scheduling software provides a better carrier experience, facility-specific rules, and dock-level reporting that a TMS cannot match.",
  },
];

// ─── 1v1 Comparison Table ─────────────────────────────────────────────────────
// Types and data for the interactive DataDocks-vs-competitor table.

export type FeatureSupportLevel = "standout" | "full" | "partial" | "none";

export interface FeatureDetail {
  level: FeatureSupportLevel;
  text: string;
  needsReview?: string;
}

export interface ComparisonFeature {
  id: string;
  label: string;
  needsReview?: string;
}

export interface ComparisonFeatureGroup {
  id: string;
  label: string;
  features: ComparisonFeature[];
  needsReview?: string;
}

export interface ComparisonCompetitor {
  id: string;
  name: string;
  tagline: string;
  tier: "lightweight" | "suite-module" | "dedicated";
  features: Record<string, FeatureDetail>;
}

export const datadocksFeatures: Record<string, FeatureDetail> = {
  "onboarding-model": {
    "level": "full",
    "text": "By invitation link or carrier self-serve"
  },
  "portal-visibility": {
    "level": "standout",
    "text": "Carriers see their own appointment history and optimal booking slots"
  },
  "mandatory-fields": {
    "level": "full",
    "text": "Unique requirements can be set up for each type of load"
  },
  "capacity-control": {
    "level": "full",
    "text": "Define specific limits for any type of load, for any time period"
  },
  "scheduling-rules": {
    "level": "standout",
    "text": "Flexible rules based on each carrier, shift and load type"
  },
  "auto-approve": {
    "level": "full",
    "text": "Auto-approve specific load types or carriers "
  },
  "drag-drop": {
    "level": "full",
    "text": "Drag-and-drop scheduling with rule violation warnings and manual overrides"
  },
  "schedule-views": {
    "level": "full",
    "text": "Calendar, schedule, dock, and pending views with quick edits"
  },
  "mobile-app": {
    "level": "full",
    "text": "Powerful, native iOS and Android apps"
  },
  "bulk-scheduling": {
    "level": "full",
    "text": "Bulk CSV upload, batch editing, and recurring schedules"
  },
  "duration-calc": {
    "level": "full",
    "text": "Duration rules using historical load and carrier trends"
  },
  "scheduling-intelligence": {
    "level": "standout",
    "text": "Real time capacity warnings and conflict resolution with Kyle AI"
  },
  "driver-self-checkin": {
    "level": "full",
    "text": "Web app, QR code, and kiosk check-in"
  },
  "gate-guard-checkin": {
    "level": "full",
    "text": "Guard entry flows with photos and checklists"
  },
  "unscheduled-workins": {
    "level": "full",
    "text": "Separate rules, checklists, and calendar color-coding for work-ins"
  },
  "load-po-matching": {
    "level": "standout",
    "text": "Real-time PO verification and line-item limit enforcement during booking"
  },
  "yard-jockey": {
    "level": "full",
    "text": "Drag-and-drop yard tasking and jockey alerts"
  },
  "yard-visibility": {
    "level": "full",
    "text": "Real-time yard positions map with detail and action view"
  },
  "live-chat": {
    "level": "standout",
    "text": "In-app chat with automated SMS and email alerts"
  },
  "carrier-scorecarding": {
    "level": "full",
    "text": "Automated compliance scoring and on-time tracking"
  },
  "performance-reporting": {
    "level": "full",
    "text": "Track performance by shift, load type, dock door, and more"
  },
  "detention-tracking": {
    "level": "full",
    "text": "Timestamped dwell time logging and complete audit history"
  },
  "inspection-checklists": {
    "level": "full",
    "text": "Custom load inspection forms and blind counts"
  },
  "wms-tms-erp": {
    "level": "full",
    "text": "Integrations with any system via API and webhooks"
  },
  "api-maturity": {
    "level": "full",
    "text": "REST API and real-time webhooks for system sync"
  },
  "webhook-triggers": {
    "level": "standout",
    "text": "Granular webhooks (created, walk-ins, status, cancelled)"
  },
  "edi-iot": {
    "level": "full",
    "text": "EDI and IoT functionality via API or middleware"
  },
  "data-import-export": {
    "level": "full",
    "text": "CSV and Excel bulk uploads for POs; custom exports"
  },
  "multi-site": {
    "level": "standout",
    "text": "Instant site toggling and multi-facility views"
  },
  "rbac": {
    "level": "full",
    "text": "Different permission sets for admin, office, gate, clerk, yard, CSR, and read only"
  },
  "sso-iam": {
    "level": "full",
    "text": "SSO via Microsoft Entra ID"
  },
  "audit-trails": {
    "level": "standout",
    "text": "Granular history for all actions and system edits"
  },
  "security-certs": {
    "level": "full",
    "text": "SOC 2 Type II, GDPR, and CCPA compliant"
  },
  "license-architecture": {
    "level": "full",
    "text": "Per-facility with 1-month minimum and progressive discounts"
  },
  "custom-dev": {
    "level": "standout",
    "text": "Deepest customer-driven development in the industry"
  },
  "onboarding-structure": {
    "level": "standout",
    "text": "Live tailored training sessions and provided recordings"
  },
  "support-slas": {
    "level": "full",
    "text": "Direct phone, email, and live video from dedicated reps"
  }
};

export const comparisonFeatureGroups: ComparisonFeatureGroup[] = [
  {
    id: "carrier-portal",
    label: "Carrier Self-Booking Portal",
    features: [
      { id: "onboarding-model", label: "Carrier onboarding model" },
      { id: "portal-visibility", label: "Portal visibility & access control" },
      { id: "mandatory-fields", label: "Booking field requirements" },
      { id: "capacity-control", label: "Capacity control" },
      { id: "scheduling-rules", label: "Scheduling rules engine" },
      { id: "auto-approve", label: "Auto-approve workflows" },
    ],
  },
  {
    id: "schedule-management",
    label: "Schedule Management & Automations",
    features: [
      { id: "drag-drop", label: "Rescheduling Workflows" },
      { id: "schedule-views", label: "Schedule views & live visibility" },
      { id: "mobile-app", label: "Mobile app" },
      { id: "bulk-scheduling", label: "Bulk & recurring scheduling" },
      { id: "duration-calc", label: "Appointment duration calculation" },
      { id: "scheduling-intelligence", label: "Exception Management" },
    ],
  },
  {
    id: "gate-yard",
    label: "Gate Check-in & Yard Management",
    features: [
      { id: "driver-self-checkin", label: "Driver self-check-in" },
      { id: "gate-guard-checkin", label: "Gate guard check-in procedures" },
      { id: "unscheduled-workins", label: "Unscheduled load work-in handling" },
      { id: "load-po-matching", label: "Load identity & PO matching" },
      { id: "yard-jockey", label: "Yard jockey & drop trailer workflows" },
      { id: "yard-visibility", label: "Yard inventory visibility" },
    ],
  },
  {
    id: "comms-reporting",
    label: "Carrier Communications & Reporting",
    features: [
      { id: "live-chat", label: "Carrier messaging & notifications" },
      { id: "carrier-scorecarding", label: "Carrier scorecarding" },
      { id: "performance-reporting", label: "Granular performance reporting" },
      { id: "detention-tracking", label: "Detention tracking" },
      { id: "inspection-checklists", label: "Inspection & audit checklists" },
    ],
  },
  {
    id: "integrations",
    label: "System Integration & Data Workflows",
    features: [
      { id: "wms-tms-erp", label: "WMS / TMS / ERP integrations" },
      { id: "api-maturity", label: "API maturity" },
      { id: "webhook-triggers", label: "Webhook event triggers" },
      { id: "edi-iot", label: "EDI & IoT connectivity" },
      { id: "data-import-export", label: "Manual data import / export" },
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise Governance & Security",
    features: [
      { id: "multi-site", label: "Multi-site management" },
      { id: "rbac", label: "Role-based access control" },
      { id: "sso-iam", label: "SSO & identity management" },
      { id: "audit-trails", label: "Audit trails" },
      { id: "security-certs", label: "Security & compliance certifications" },
    ],
  },
  {
    id: "licensing-support",
    label: "Licensing, Implementation & Support",
    features: [
      { id: "license-architecture", label: "License architecture" },
      { id: "custom-dev", label: "Custom development" },
      { id: "onboarding-structure", label: "Onboarding & implementation" },
      { id: "support-slas", label: "Support access & SLAs" },
    ],
  },
];

export const comparisonCompetitors: ComparisonCompetitor[] = [
  {
    "id": "opendock",
    "name": "Opendock",
    "tagline": "Standard scheduling aimed at freight brokers",
    "tier": "dedicated",
    "features": {
      "onboarding-model": {
        "level": "partial",
        "text": "Carrier self-registration only"
      },
      "portal-visibility": {
        "level": "none",
        "text": "Anyone can register as a carrier and see any facility's schedule and data"
      },
      "mandatory-fields": {
        "level": "partial",
        "text": "Fixed set of fields, set up each as optional or mandatory"
      },
      "capacity-control": {
        "level": "partial",
        "text": "Appointment or unit limits per day/week for each dock door"
      },
      "scheduling-rules": {
        "level": "full",
        "text": "Allocate specific load types to different dock doors"
      },
      "auto-approve": {
        "level": "partial",
        "text": "Optional 'requested' status applied to all"
      },
      "drag-drop": {
        "level": "partial",
        "text": "Basic drag-and-drop rescheduling. No rule warnings for internally booked appointments"
      },
      "schedule-views": {
        "level": "full",
        "text": "'Multiple calendars' architecture with day, week, and month view"
      },
      "mobile-app": {
        "level": "partial",
        "text": "Web app can handle basic tasks on mobile"
      },
      "bulk-scheduling": {
        "level": "partial",
        "text": "Manual recurring appointment; cannot be edited once set up"
      },
      "duration-calc": {
        "level": "partial",
        "text": "Durations determined by fixed 'load type' attribute"
      },
      "driver-self-checkin": {
        "level": "full",
        "text": "QR-code check-in, kiosk mode and SMS"
      },
      "gate-guard-checkin": {
        "level": "partial",
        "text": "Poor out-of-the-box, but powerful with SmartGate add on"
      },
      "unscheduled-workins": {
        "level": "standout",
        "text": "Self-serve work-ins or automate with SmartGate and vision cameras"
      },
      "load-po-matching": {
        "level": "partial",
        "text": "Manual PO number or BOL upload; lacks database validation"
      },
      "yard-jockey": {
        "level": "full",
        "text": "Yard move triggers, drop & hook procedures"
      },
      "yard-visibility": {
        "level": "partial",
        "text": "No map; limited visibility unless you pay for SmartGate"
      },
      "carrier-scorecarding": {
        "level": "partial",
        "text": "Export reports as CSV or raw data and analyze manually"
      },
      "performance-reporting": {
        "level": "partial",
        "text": "\"Warehouse Insights\" good for comparing many facilities"
      },
      "detention-tracking": {
        "level": "full",
        "text": "Automate with SmartGate and vision cameras, or add manual timestamps"
      },
      "inspection-checklists": {
        "level": "partial",
        "text": "Requires additional SmartGate product. No blind counts."
      },
      "wms-tms-erp": {
        "level": "full",
        "text": "Connects to SAP, Oracle, Blue Yonder, and Manhattan"
      },
      "api-maturity": {
        "level": "full",
        "text": "REST API (Neutron) and streaming API (Subspace)"
      },
      "webhook-triggers": {
        "level": "full",
        "text": "Some webhooks for bookings, updates, and cancelations"
      },
      "edi-iot": {
        "level": "full",
        "text": "EDI via middleware; tablet kiosks and QR scanners"
      },
      "data-import-export": {
        "level": "partial",
        "text": "CSV/Excel upload for rules/POs; limited reporting exports"
      },
      "multi-site": {
        "level": "partial",
        "text": "All sites managed from the same screen by default; can get cluttered"
      },
      "rbac": {
        "level": "partial",
        "text": "Site-scoped role tiers (Owner, Admin, Manager)"
      },
      "sso-iam": {
        "level": "full",
        "text": "SAML 2.0 SSO (Azure AD, Okta)"
      },
      "audit-trails": {
        "level": "partial",
        "text": "Booking history log tracking basic booking edits"
      },
      "security-certs": {
        "level": "full",
        "text": "SOC 2 Type II, GDPR compliant"
      },
      "license-architecture": {
        "level": "partial",
        "text": "Annual commitment starting at ~$6-7k per facility"
      },
      "custom-dev": {
        "level": "none",
        "text": "Standard API access; no core feature customization"
      },
      "onboarding-structure": {
        "level": "partial",
        "text": "Self-serve setup and guided enterprise onboarding"
      },
      "support-slas": {
        "level": "partial",
        "text": "Tiered ticket and phone support; free carrier support"
      },
      "scheduling-intelligence": {
        "level": "none",
        "text": "Limited overall, but handles unscheduled work-ins well"
      },
      "live-chat": {
        "level": "partial",
        "text": "Send and receive SMS from in-system with SmartGate"
      }
    }
  },
  {
    "id": "conduit",
    "name": "Conduit",
    "tagline": "Strong on check-in workflows",
    "tier": "lightweight",
    "features": {
      "onboarding-model": {
        "level": "partial",
        "text": "Branded portal link; guest self-booking"
      },
      "portal-visibility": {
        "level": "full",
        "text": "Carriers see real-time door availability"
      },
      "mandatory-fields": {
        "level": "full",
        "text": "Configurable fields"
      },
      "capacity-control": {
        "level": "full",
        "text": "Configurable door, labor, and volume capacity rules"
      },
      "scheduling-rules": {
        "level": "full",
        "text": "Custom rules per door, load type, and shift"
      },
      "auto-approve": {
        "level": "partial",
        "text": "Auto-approve trusted carriers or load types"
      },
      "drag-drop": {
        "level": "partial",
        "text": "Visual grid editing without rule violation alerts"
      },
      "schedule-views": {
        "level": "partial",
        "text": "Dock schedule, daily block, and list views"
      },
      "mobile-app": {
        "level": "partial",
        "text": "Mobile-optimized web browser access"
      },
      "bulk-scheduling": {
        "level": "full",
        "text": "Bulk CSV import and batch schedule editing"
      },
      "duration-calc": {
        "level": "partial",
        "text": "Fixed duration rules based on load category"
      },
      "driver-self-checkin": {
        "level": "standout",
        "text": "Kiosk, QR code, mobile, and driver ID verification"
      },
      "gate-guard-checkin": {
        "level": "full",
        "text": "Guard gate tasks, ID check, and gate log entry"
      },
      "unscheduled-workins": {
        "level": "partial",
        "text": "Gate guard work-in check-in and queue logging"
      },
      "load-po-matching": {
        "level": "partial",
        "text": "Manual PO entry and basic field validation"
      },
      "yard-jockey": {
        "level": "full",
        "text": "Drop & hook job dispatching with mobile jockey app"
      },
      "yard-visibility": {
        "level": "partial",
        "text": "Minimalist spatial map reflecting physical layout"
      },
      "carrier-scorecarding": {
        "level": "partial",
        "text": "Basic arrival timestamp logging and summary reports"
      },
      "performance-reporting": {
        "level": "full",
        "text": "Prebuilt KPI dashboards and BI tool API sync"
      },
      "detention-tracking": {
        "level": "full",
        "text": "Dwell time tracking and dock turnaround logs"
      },
      "inspection-checklists": {
        "level": "full",
        "text": "Check-in inspection forms with photo attachment"
      },
      "wms-tms-erp": {
        "level": "partial",
        "text": "Connectors for 3PL WMS/ERP (Synapse, Extensiv, SAP)"
      },
      "api-maturity": {
        "level": "partial",
        "text": "REST API for bookings, door capacity, and status"
      },
      "webhook-triggers": {
        "level": "partial",
        "text": "Webhooks for booking, reschedule, cancel, and check-in"
      },
      "edi-iot": {
        "level": "partial",
        "text": "EDI via middleware (X12); kiosks and GPS hardware"
      },
      "data-import-export": {
        "level": "partial",
        "text": "CSV manifest uploads and CSV/Excel reporting"
      },
      "multi-site": {
        "level": "partial",
        "text": "Multi-facility 3PL support and client data segmentation"
      },
      "rbac": {
        "level": "partial",
        "text": "Roles for operators, gate clerks, carriers, and clients"
      },
      "sso-iam": {
        "level": "partial",
        "text": "SAML 2.0 SSO (Azure AD, Okta) on annual plans"
      },
      "audit-trails": {
        "level": "partial",
        "text": "Chronological action logs recorded on each booking"
      },
      "security-certs": {
        "level": "partial",
        "text": "SOC 2 compliant cloud infrastructure; GDPR compliant"
      },
      "license-architecture": {
        "level": "partial",
        "text": "Annual terms; per-facility rate starting at $49/month"
      },
      "custom-dev": {
        "level": "partial",
        "text": "Custom check-in workflows and portal rules as requested"
      },
      "onboarding-structure": {
        "level": "partial",
        "text": "Guided remote onboarding with live screen-share"
      },
      "support-slas": {
        "level": "partial",
        "text": "Email and messaging support during operational hours"
      },
      "scheduling-intelligence": {
        "level": "partial",
        "text": "Basic overbooking warnings and manual slot overrides for gate clerks."
      },
      "live-chat": {
        "level": "partial",
        "text": "Carrier portal alerts and automated status updates"
      }
    }
  },
  {
    "id": "goramp",
    "name": "Goramp",
    "tagline": "Mid-size operations, good value",
    "tier": "dedicated",
    "features": {
      "onboarding-model": {
        "level": "full",
        "text": "One-click invitation link (no password)"
      },
      "portal-visibility": {
        "level": "full",
        "text": "Carriers can view their upcoming bookings and notifications"
      },
      "mandatory-fields": {
        "level": "partial",
        "text": "Custom fields and document uploads, but same rules for all."
      },
      "capacity-control": {
        "level": "partial",
        "text": "Duration-based and unit-based limits per day, with cutoff times"
      },
      "scheduling-rules": {
        "level": "partial",
        "text": "Set up rules for each carrier or door. No granular rules."
      },
      "auto-approve": {
        "level": "none",
        "text": "No approval rules engine; bookings auto-confirm"
      },
      "drag-drop": {
        "level": "partial",
        "text": "Basic visual grid rescheduling; rule enforcement is fixed by user role"
      },
      "schedule-views": {
        "level": "partial",
        "text": "Various calendar views and occupancy map"
      },
      "mobile-app": {
        "level": "partial",
        "text": "Web app can handle check-ins on mobile"
      },
      "bulk-scheduling": {
        "level": "full",
        "text": "Carrier self-service recurring appointments"
      },
      "duration-calc": {
        "level": "partial",
        "text": "Possible to automate durations based on unit counts"
      },
      "driver-self-checkin": {
        "level": "partial",
        "text": "SMS and QR code check-in"
      },
      "gate-guard-checkin": {
        "level": "standout",
        "text": "Dedicated gate management dashboard"
      },
      "unscheduled-workins": {
        "level": "full",
        "text": "Handled well at the gate management step"
      },
      "load-po-matching": {
        "level": "partial",
        "text": "Manual PO entry on basic tiers; automated API integrations extra"
      },
      "yard-jockey": {
        "level": "partial",
        "text": "Basic yard jockey tasks; no drop trailer flows"
      },
      "yard-visibility": {
        "level": "partial",
        "text": "Trailer status and locations grid, but no map or quick actions"
      },
      "carrier-scorecarding": {
        "level": "full",
        "text": "Performance dashboards for each carrier"
      },
      "performance-reporting": {
        "level": "partial",
        "text": "Basic internal KPI dashboards, but lacks detailed visual reports"
      },
      "detention-tracking": {
        "level": "full",
        "text": "Automated timestamps trigger alerts for overstays and idle docks"
      },
      "inspection-checklists": {
        "level": "partial",
        "text": "Built-in compliance logs, but no customization"
      },
      "wms-tms-erp": {
        "level": "partial",
        "text": "SAP, Microsoft Dynamics, and Odoo connectors"
      },
      "api-maturity": {
        "level": "partial",
        "text": "REST API for ramps, time slots, and inbound order queues"
      },
      "webhook-triggers": {
        "level": "partial",
        "text": "Webhooks for booking, arrival, and loading milestones"
      },
      "edi-iot": {
        "level": "partial",
        "text": "EDI via API bridges; QR code signage and tablet kiosks"
      },
      "data-import-export": {
        "level": "partial",
        "text": "CSV/Excel upload for bulk bookings and data exports"
      },
      "multi-site": {
        "level": "partial",
        "text": "Multi-warehouse console with site switching and hours"
      },
      "rbac": {
        "level": "partial",
        "text": "Pre-set roles: Admin, Warehouse Manager, Guard, Carrier"
      },
      "sso-iam": {
        "level": "partial",
        "text": "SAML 2.0 and Google SSO supported on enterprise tiers"
      },
      "audit-trails": {
        "level": "partial",
        "text": "Standard event logging for booking creation and edits"
      },
      "security-certs": {
        "level": "partial",
        "text": "GDPR compliant; AWS SOC 2 certified infrastructure"
      },
      "license-architecture": {
        "level": "partial",
        "text": "Per-door pricing with 1-month minimum commitment"
      },
      "custom-dev": {
        "level": "none",
        "text": "Standard API/webhook integration work only"
      },
      "onboarding-structure": {
        "level": "partial",
        "text": "Guided remote onboarding with live screen-share"
      },
      "support-slas": {
        "level": "partial",
        "text": "Ticket and in-app chat support during business hours"
      },
      "scheduling-intelligence": {
        "level": "full",
        "text": "Strong manual booking overrides, but no predictive exception engine."
      },
      "live-chat": {
        "level": "partial",
        "text": "Automated SMS and email notifications; no live chat"
      }
    }
  },
  {
    "id": "c3-solutions",
    "name": "C3 Solutions",
    "tagline": "Highly structured solution for IT-led ops",
    "tier": "dedicated",
    "features": {
      "onboarding-model": {
        "level": "partial",
        "text": "Manual facility-provisioned setup"
      },
      "portal-visibility": {
        "level": "full",
        "text": "Approved carriers see their pending bookings and every open time slot"
      },
      "mandatory-fields": {
        "level": "partial",
        "text": "Custom and mandatory fields, but no document uploads"
      },
      "capacity-control": {
        "level": "partial",
        "text": "Rules for max loads or pallets for any time period, but no cutoff"
      },
      "scheduling-rules": {
        "level": "full",
        "text": "Smart rules for each time or load possible, but tricky to set up"
      },
      "auto-approve": {
        "level": "full",
        "text": "Auto-approve based on specific conditions"
      },
      "drag-drop": {
        "level": "full",
        "text": "Drag-and-drop rescheduling with escalation for rule overrides"
      },
      "schedule-views": {
        "level": "full",
        "text": "Gantt capacity charts and timeline views"
      },
      "mobile-app": {
        "level": "partial",
        "text": "Basic web app for logging fault photos"
      },
      "bulk-scheduling": {
        "level": "full",
        "text": "standing appt with capacity limits and expiration dates"
      },
      "duration-calc": {
        "level": "partial",
        "text": "Simple duration rules based on load properties"
      },
      "driver-self-checkin": {
        "level": "full",
        "text": "Pre-arrival check-in via C3 Yard module integration"
      },
      "gate-guard-checkin": {
        "level": "partial",
        "text": "Requires C3 Hive and C3 Yard subscriptions for advanced features"
      },
      "unscheduled-workins": {
        "level": "none",
        "text": "Relies on strict exception approval queues; tricky without C3 Hive add-on"
      },
      "load-po-matching": {
        "level": "standout",
        "text": "Automated PO/BOL line-item validation via ERP and WMS sync"
      },
      "yard-jockey": {
        "level": "full",
        "text": "C3 Yard jockey tasking with drop trailer support"
      },
      "yard-visibility": {
        "level": "standout",
        "text": "C3 Yard module has a color-coded visual yard inventory map"
      },
      "carrier-scorecarding": {
        "level": "partial",
        "text": "Basic on-time, no-show, and carrier compliance audits"
      },
      "performance-reporting": {
        "level": "partial",
        "text": "Basic, database-like reports covering overall metrics"
      },
      "detention-tracking": {
        "level": "full",
        "text": "Arrival, movement and departure timestamps"
      },
      "inspection-checklists": {
        "level": "partial",
        "text": "Configurable quality assurance forms; no blind counts"
      },
      "wms-tms-erp": {
        "level": "full",
        "text": "Pre-built SAP, Manhattan, and Blue Yonder links"
      },
      "api-maturity": {
        "level": "full",
        "text": "REST API with programmatic control of doors and rules"
      },
      "webhook-triggers": {
        "level": "full",
        "text": "Webhooks for booking, status, gate, and door events"
      },
      "edi-iot": {
        "level": "full",
        "text": "X12 and EDIFACT EDI; gate hardware, LPR, and kiosks"
      },
      "data-import-export": {
        "level": "full",
        "text": "CSV and Excel import wizard for POs; PDF exports"
      },
      "multi-site": {
        "level": "full",
        "text": "Multi-facility network rules and shared carrier database"
      },
      "rbac": {
        "level": "full",
        "text": "Fine-grained roles for facility, gate, yard, and carriers"
      },
      "sso-iam": {
        "level": "full",
        "text": "SAML 2.0 integration "
      },
      "audit-trails": {
        "level": "full",
        "text": "Dedicated audit module for actions and overrides"
      },
      "security-certs": {
        "level": "full",
        "text": "SOC 2 Type II compliant; ISO 27001 certified cloud"
      },
      "license-architecture": {
        "level": "partial",
        "text": "Annual terms; tiered by active doors and add-on modules"
      },
      "custom-dev": {
        "level": "partial",
        "text": "Paid co-development for custom logic and reporting"
      },
      "onboarding-structure": {
        "level": "full",
        "text": "Structured implementation led by business analysts"
      },
      "support-slas": {
        "level": "full",
        "text": "24/7 operational helpdesk with defined response SLAs"
      },
      "scheduling-intelligence": {
        "level": "full",
        "text": "Exceptions automatically converted into tasks for review"
      },
      "live-chat": {
        "level": "partial",
        "text": "Strong messaging with C3 Hive add-on but poor without it"
      }
    }
  },
  {
    "id": "loadingcalendar",
    "name": "LoadingCalendar",
    "tagline": "Simple and affordable for small ops",
    "tier": "lightweight",
    "features": {
      "onboarding-model": {
        "level": "partial",
        "text": "Magic link booking; no carrier accounts"
      },
      "portal-visibility": {
        "level": "partial",
        "text": "Carriers see open time slots on clean calendar"
      },
      "mandatory-fields": {
        "level": "none",
        "text": "Fixed fields only"
      },
      "capacity-control": {
        "level": "partial",
        "text": "Dock operating hours and basic daily appointment limits"
      },
      "scheduling-rules": {
        "level": "partial",
        "text": "Per-dock rules, operating hours, and load types"
      },
      "auto-approve": {
        "level": "none",
        "text": "All bookings approved by default; no queue"
      },
      "drag-drop": {
        "level": "partial",
        "text": "Visual calendar editing without rule enforcement"
      },
      "schedule-views": {
        "level": "full",
        "text": "Minimalist calendar interface that works great on touchscreens and big TVs"
      },
      "mobile-app": {
        "level": "partial",
        "text": "Responsive web app for mobile browsers"
      },
      "bulk-scheduling": {
        "level": "none",
        "text": "No bulk CSV import or recurring schedules"
      },
      "duration-calc": {
        "level": "partial",
        "text": "Durations assigned by fixed load type rule"
      },
      "driver-self-checkin": {
        "level": "none",
        "text": "No driver check-in or kiosk workflow"
      },
      "gate-guard-checkin": {
        "level": "none",
        "text": "No gate guard check-in module"
      },
      "unscheduled-workins": {
        "level": "partial",
        "text": "Manual ad-hoc appointment creation for work-ins"
      },
      "load-po-matching": {
        "level": "none",
        "text": "No PO or load matching functionality"
      },
      "yard-jockey": {
        "level": "none",
        "text": "No yard jockey management or tasking"
      },
      "yard-visibility": {
        "level": "none",
        "text": "No yard visibility or trailer tracking"
      },
      "carrier-scorecarding": {
        "level": "none",
        "text": "No carrier compliance or performance scoring"
      },
      "performance-reporting": {
        "level": "partial",
        "text": "Basic schedule summary logs and CSV export"
      },
      "detention-tracking": {
        "level": "none",
        "text": "No dwell time or detention tracking"
      },
      "inspection-checklists": {
        "level": "none",
        "text": "No inspection checklists or QA forms"
      },
      "wms-tms-erp": {
        "level": "none",
        "text": "No native adapters; custom user builds via API required"
      },
      "api-maturity": {
        "level": "none",
        "text": "Basic REST API for schedules and appointment blocks"
      },
      "webhook-triggers": {
        "level": "none",
        "text": "No native webhooks; external polling required"
      },
      "edi-iot": {
        "level": "none",
        "text": "Not available"
      },
      "data-import-export": {
        "level": "partial",
        "text": "Manual export of calendar views and lists to CSV/Excel"
      },
      "multi-site": {
        "level": "partial",
        "text": "Multiple warehouse calendars under a single login"
      },
      "rbac": {
        "level": "none",
        "text": "Basic role segmentation (Admin, Manager, User)"
      },
      "sso-iam": {
        "level": "none",
        "text": "Standard username and password; no SAML SSO"
      },
      "audit-trails": {
        "level": "none",
        "text": "Minimal revision history for basic booking creation"
      },
      "security-certs": {
        "level": "none",
        "text": "GDPR compliant; standard HTTPS/TLS encryption"
      },
      "license-architecture": {
        "level": "partial",
        "text": "Monthly terms; $99/month flat rate for unlimited usage"
      },
      "custom-dev": {
        "level": "none",
        "text": "Standardized platform; self-serve API access only"
      },
      "onboarding-structure": {
        "level": "none",
        "text": "Self-serve via written setup documentation"
      },
      "support-slas": {
        "level": "none",
        "text": "Email ticketing during business hours"
      },
      "scheduling-intelligence": {
        "level": "none",
        "text": "Basic slot allocation; no conflict warnings"
      },
      "live-chat": {
        "level": "none",
        "text": "No carrier chat or automated messaging"
      }
    }
  },
  {
    "id": "blue-yonder",
    "name": "Blue Yonder",
    "tagline": "SCMS with basic dock scheduling",
    "tier": "suite-module",
    "features": {
      "onboarding-model": {
        "level": "partial",
        "text": "IT-provisioned enterprise accounts"
      },
      "portal-visibility": {
        "level": "partial",
        "text": "Carriers view assigned slots via WMS portal"
      },
      "mandatory-fields": {
        "level": "partial",
        "text": "Standard WMS fields"
      },
      "capacity-control": {
        "level": "partial",
        "text": "WMS labor and bay door capacity constraints"
      },
      "scheduling-rules": {
        "level": "partial",
        "text": "WMS-inherited door and labor scheduling rules"
      },
      "auto-approve": {
        "level": "partial",
        "text": "WMS order validation determines slot status"
      },
      "drag-drop": {
        "level": "none",
        "text": "Form-based edits; no interactive grid rules"
      },
      "schedule-views": {
        "level": "none",
        "text": "WMS order lists; no standalone calendar views"
      },
      "mobile-app": {
        "level": "partial",
        "text": "Mobile web access and RF scanner workflows"
      },
      "bulk-scheduling": {
        "level": "partial",
        "text": "Batch PO/order imports via WMS data loaders"
      },
      "duration-calc": {
        "level": "partial",
        "text": "WMS order parameters determine slot length"
      },
      "driver-self-checkin": {
        "level": "none",
        "text": "TMS tracking; no driver self-check-in"
      },
      "gate-guard-checkin": {
        "level": "none",
        "text": "WMS receiving screen; no dedicated guard app"
      },
      "unscheduled-workins": {
        "level": "partial",
        "text": "WMS ad-hoc receiving receipt for work-in trucks"
      },
      "load-po-matching": {
        "level": "full",
        "text": "Automated WMS and ERP PO line item validation"
      },
      "yard-jockey": {
        "level": "partial",
        "text": "Spotter tasking requires IoT/RFID hardware layer"
      },
      "yard-visibility": {
        "level": "partial",
        "text": "3D yard map requires camera or IoT hardware layer"
      },
      "carrier-scorecarding": {
        "level": "partial",
        "text": "Scorecarding feeds via Network Scheduling & TMS"
      },
      "performance-reporting": {
        "level": "full",
        "text": "Enterprise WMS/TMS analytics and KPI reports"
      },
      "detention-tracking": {
        "level": "partial",
        "text": "Event timestamp logging for gate and dock dwell"
      },
      "inspection-checklists": {
        "level": "partial",
        "text": "Inbound WMS receiving inspection and QC logging"
      },
      "wms-tms-erp": {
        "level": "full",
        "text": "WMS/TMS/YMS links and enterprise SAP/Oracle connectors"
      },
      "api-maturity": {
        "level": "standout",
        "text": "Luminate API suite (REST, OpenAPI, Kafka streams)"
      },
      "webhook-triggers": {
        "level": "full",
        "text": "High-frequency event streaming via Kafka and webhooks"
      },
      "edi-iot": {
        "level": "full",
        "text": "EDI support (X12, EDIFACT) and gate hardware"
      },
      "data-import-export": {
        "level": "full",
        "text": "High-throughput XML, CSV, and flat file loaders"
      },
      "multi-site": {
        "level": "full",
        "text": "Global multi-entity and regional control towers"
      },
      "rbac": {
        "level": "full",
        "text": "Field-level RBAC for custom corporate and site profiles"
      },
      "sso-iam": {
        "level": "full",
        "text": "SAML 2.0 and OIDC SSO with SCIM provisioning"
      },
      "audit-trails": {
        "level": "full",
        "text": "Audit logging for all edits, overrides, and logins"
      },
      "security-certs": {
        "level": "full",
        "text": "SOC 1/2 Type II, ISO 27001/27017/27018 certified"
      },
      "license-architecture": {
        "level": "none",
        "text": "3-year terms; suite license tied to facility volume"
      },
      "custom-dev": {
        "level": "partial",
        "text": "Luminate Platform extensions or paid service contracts"
      },
      "onboarding-structure": {
        "level": "partial",
        "text": "Implementation via professional services and GSIs"
      },
      "support-slas": {
        "level": "full",
        "text": "Tiered enterprise SLAs with 24/7 critical response"
      },
      "scheduling-intelligence": {
        "level": "partial",
        "text": "WMS exception queues and role overrides"
      },
      "live-chat": {
        "level": "partial",
        "text": "Automated carrier email and WMS status alerts"
      }
    }
  },
  {
    "id": "manhattan",
    "name": "Manhattan",
    "tagline": "WMS with yard management built in",
    "tier": "suite-module",
    "features": {
      "onboarding-model": {
        "level": "none",
        "text": "Internal WMS entry; no carrier portal"
      },
      "portal-visibility": {
        "level": "none",
        "text": "No carrier slot discovery portal"
      },
      "mandatory-fields": {
        "level": "partial",
        "text": "WMS-driven fields"
      },
      "capacity-control": {
        "level": "partial",
        "text": "WMS-driven dock door throughput limits"
      },
      "scheduling-rules": {
        "level": "partial",
        "text": "WMS receiving rules and dock door constraints"
      },
      "auto-approve": {
        "level": "none",
        "text": "No carrier booking approval engine"
      },
      "drag-drop": {
        "level": "none",
        "text": "WMS receiving queue; no interactive calendar"
      },
      "schedule-views": {
        "level": "none",
        "text": "WMS receiving queue; no standalone calendar UI"
      },
      "mobile-app": {
        "level": "partial",
        "text": "Mobile WMS workflows on handheld devices"
      },
      "bulk-scheduling": {
        "level": "partial",
        "text": "Bulk order ingestion via WMS data loaders"
      },
      "duration-calc": {
        "level": "partial",
        "text": "WMS receiving rules dictate slot duration"
      },
      "driver-self-checkin": {
        "level": "none",
        "text": "Requires WMS/TMS desk guard check-in"
      },
      "gate-guard-checkin": {
        "level": "none",
        "text": "WMS order entry; no dedicated guard app"
      },
      "unscheduled-workins": {
        "level": "partial",
        "text": "WMS unscheduled receipt entry at receiving desk"
      },
      "load-po-matching": {
        "level": "full",
        "text": "Deep WMS receiving order and PO validation"
      },
      "yard-jockey": {
        "level": "partial",
        "text": "Jockey tasking requires heavy IT configuration"
      },
      "yard-visibility": {
        "level": "partial",
        "text": "Tabular trailer tracking; no dynamic visual yard map"
      },
      "carrier-scorecarding": {
        "level": "partial",
        "text": "Carrier scorecarding via enterprise TMS module"
      },
      "performance-reporting": {
        "level": "full",
        "text": "Operational analytics dashboards via Active WMS"
      },
      "detention-tracking": {
        "level": "partial",
        "text": "Event timestamp logging across yard and dock"
      },
      "inspection-checklists": {
        "level": "partial",
        "text": "Inbound dock damage recording via WMS receiving"
      },
      "wms-tms-erp": {
        "level": "full",
        "text": "Manhattan Active suite, SAP, and Oracle connectors"
      },
      "api-maturity": {
        "level": "full",
        "text": "Cloud-native REST APIs on microservice architecture"
      },
      "webhook-triggers": {
        "level": "full",
        "text": "Event-driven architecture with real-time pub/sub"
      },
      "edi-iot": {
        "level": "full",
        "text": "EDI support (X12, EDIFACT) and IoT for gates"
      },
      "data-import-export": {
        "level": "full",
        "text": "High-throughput data loaders for XML, CSV, and flat files"
      },
      "multi-site": {
        "level": "full",
        "text": "Global multi-site, multi-company control tower"
      },
      "rbac": {
        "level": "full",
        "text": "Granular RBAC for UI buttons, APIs, and data fields"
      },
      "sso-iam": {
        "level": "full",
        "text": "SAML 2.0, OAuth, and OIDC with SCIM provisioning"
      },
      "audit-trails": {
        "level": "standout",
        "text": "Complete system-wide audit logging for all operations"
      },
      "security-certs": {
        "level": "full",
        "text": "SOC 1/2 Type II, ISO 27001 certified; HIPAA & GDPR"
      },
      "license-architecture": {
        "level": "none",
        "text": "3-year terms; tied to warehouse volume and suite footprint"
      },
      "custom-dev": {
        "level": "partial",
        "text": "Cloud platform extensions via paid services"
      },
      "onboarding-structure": {
        "level": "partial",
        "text": "Enterprise implementation via Manhattan Pro Services"
      },
      "support-slas": {
        "level": "full",
        "text": "SLAs with Technical Account Managers"
      },
      "scheduling-intelligence": {
        "level": "partial",
        "text": "WMS exception rules and role overrides"
      },
      "live-chat": {
        "level": "partial",
        "text": "Automated carrier email updates and notifications"
      }
    }
  },
  {
    "id": "alpega",
    "name": "Alpega",
    "tagline": "TMS with integrated dock scheduling",
    "tier": "suite-module",
    "features": {
      "onboarding-model": {
        "level": "partial",
        "text": "TMS network-managed carrier access"
      },
      "portal-visibility": {
        "level": "partial",
        "text": "Carriers see allocated slots in TMS portal"
      },
      "mandatory-fields": {
        "level": "partial",
        "text": "TMS-standard fields"
      },
      "capacity-control": {
        "level": "partial",
        "text": "TMS transport slot limits per facility schedule"
      },
      "scheduling-rules": {
        "level": "partial",
        "text": "TMS transport order scheduling constraints"
      },
      "auto-approve": {
        "level": "partial",
        "text": "TMS tender acceptance auto-confirms slots"
      },
      "drag-drop": {
        "level": "none",
        "text": "Context menu updates; no visual grid rules"
      },
      "schedule-views": {
        "level": "full",
        "text": "TMS transport slot calendar and timeline views"
      },
      "mobile-app": {
        "level": "partial",
        "text": "Mobile web browser portal for carriers"
      },
      "bulk-scheduling": {
        "level": "partial",
        "text": "Batch transport order imports via TMS"
      },
      "duration-calc": {
        "level": "full",
        "text": "Automated slot duration rules via TMS data"
      },
      "driver-self-checkin": {
        "level": "partial",
        "text": "Geofenced carrier tracking; no self-kiosk"
      },
      "gate-guard-checkin": {
        "level": "partial",
        "text": "TMS arrival timestamp logging tools"
      },
      "unscheduled-workins": {
        "level": "partial",
        "text": "Manual ad-hoc slot booking for unannounced loads"
      },
      "load-po-matching": {
        "level": "partial",
        "text": "TMS transport order and shipment PO validation"
      },
      "yard-jockey": {
        "level": "none",
        "text": "No yard jockey management tools"
      },
      "yard-visibility": {
        "level": "none",
        "text": "No yard layout visibility or mapping"
      },
      "carrier-scorecarding": {
        "level": "full",
        "text": "Automated carrier SLA and KPI performance analytics"
      },
      "performance-reporting": {
        "level": "full",
        "text": "Slot occupancy and dock utilization dashboards"
      },
      "detention-tracking": {
        "level": "partial",
        "text": "Time-slot arrival and dock dwell timestamping"
      },
      "inspection-checklists": {
        "level": "none",
        "text": "No custom inspection form builder"
      },
      "wms-tms-erp": {
        "level": "full",
        "text": "Alpega TMS integration; SAP and Oracle connectors"
      },
      "api-maturity": {
        "level": "full",
        "text": "REST and SOAP services for order ingestion and sync"
      },
      "webhook-triggers": {
        "level": "partial",
        "text": "Webhooks for booking, reschedule, cancel, and arrival"
      },
      "edi-iot": {
        "level": "full",
        "text": "EDI support and gate hardware integration"
      },
      "data-import-export": {
        "level": "full",
        "text": "Scheduled and manual CSV/Excel batch import and export"
      },
      "multi-site": {
        "level": "standout",
        "text": "Global multi-site control tower with cross-facility scheduling rules"
      },
      "rbac": {
        "level": "full",
        "text": "RBAC with cross-site custom permissions"
      },
      "sso-iam": {
        "level": "full",
        "text": "SAML 2.0 and OAuth SSO with SCIM provisioning"
      },
      "audit-trails": {
        "level": "full",
        "text": "Immutable timestamped logging across network updates"
      },
      "security-certs": {
        "level": "full",
        "text": "ISO 27001 certified; SOC 2 cloud hosting; GDPR"
      },
      "license-architecture": {
        "level": "partial",
        "text": "3-year terms; volume and site footprint tiering"
      },
      "custom-dev": {
        "level": "partial",
        "text": "Paid professional services for custom connectors"
      },
      "onboarding-structure": {
        "level": "partial",
        "text": "Enterprise implementation led by professional services"
      },
      "support-slas": {
        "level": "full",
        "text": "Tiered SLA support with 24/7 critical coverage"
      },
      "scheduling-intelligence": {
        "level": "none",
        "text": "Manual slot overrides; basic exception logs"
      },
      "live-chat": {
        "level": "partial",
        "text": "Automated carrier email slot notifications"
      }
    }
  },
  {
    "id": "transporeon",
    "name": "Transporeon",
    "tagline": "Freight marketplace with dock add-on",
    "tier": "suite-module",
    "features": {
      "onboarding-model": {
        "level": "partial",
        "text": "Marketplace carrier network sync"
      },
      "portal-visibility": {
        "level": "partial",
        "text": "Carriers view time slots for assigned tenders"
      },
      "mandatory-fields": {
        "level": "partial",
        "text": "Standard shipment fields"
      },
      "capacity-control": {
        "level": "partial",
        "text": "Time-slot quota limits per carrier and door group"
      },
      "scheduling-rules": {
        "level": "partial",
        "text": "Marketplace tender rules and slot constraints"
      },
      "auto-approve": {
        "level": "partial",
        "text": "Marketplace tender awards auto-confirm slots"
      },
      "drag-drop": {
        "level": "none",
        "text": "Portal form edits; no visual grid rules"
      },
      "schedule-views": {
        "level": "full",
        "text": "Marketplace slot calendar and daily grid views"
      },
      "mobile-app": {
        "level": "partial",
        "text": "Mobile web portal and driver web links"
      },
      "bulk-scheduling": {
        "level": "partial",
        "text": "Batch tender import via marketplace tools"
      },
      "duration-calc": {
        "level": "partial",
        "text": "Fixed durations assigned by order profiles"
      },
      "driver-self-checkin": {
        "level": "partial",
        "text": "ZeKju app messaging or desk check-in"
      },
      "gate-guard-checkin": {
        "level": "full",
        "text": "Live gate monitoring and arrival tracking"
      },
      "unscheduled-workins": {
        "level": "partial",
        "text": "Ad-hoc slot creation for unscheduled deliveries"
      },
      "load-po-matching": {
        "level": "full",
        "text": "Marketplace tender and PO manifest matching"
      },
      "yard-jockey": {
        "level": "partial",
        "text": "Basic yard move requests without drop trailer flows"
      },
      "yard-visibility": {
        "level": "none",
        "text": "No yard visual map or trailer tracking"
      },
      "carrier-scorecarding": {
        "level": "full",
        "text": "Carrier quality evaluation and SLA performance metrics"
      },
      "performance-reporting": {
        "level": "full",
        "text": "Dock utilization and dwell time network reports"
      },
      "detention-tracking": {
        "level": "partial",
        "text": "Check-in/out timestamps and dwell time logging"
      },
      "inspection-checklists": {
        "level": "none",
        "text": "No quality inspection forms or QA logs"
      },
      "wms-tms-erp": {
        "level": "full",
        "text": "Certified SAP, Oracle, and major European TMS links"
      },
      "api-maturity": {
        "level": "full",
        "text": "REST API for slot allocation"
      },
      "webhook-triggers": {
        "level": "full",
        "text": "Real-time alerts for booking, geofencing, and status"
      },
      "edi-iot": {
        "level": "standout",
        "text": "Telematics-driven dynamic time slots, LPR gate automation, and EDI"
      },
      "data-import-export": {
        "level": "full",
        "text": "Batch processing for CSV, XML, and Excel"
      },
      "multi-site": {
        "level": "full",
        "text": "Global logistics control tower for multi-plant schedules"
      },
      "rbac": {
        "level": "full",
        "text": "RBAC across shippers, operators, and carriers"
      },
      "sso-iam": {
        "level": "full",
        "text": "SAML 2.0 and OIDC SSO with automated IDP lifecycle"
      },
      "audit-trails": {
        "level": "full",
        "text": "Audit trails for milestones and overrides"
      },
      "security-certs": {
        "level": "full",
        "text": "ISO 27001, SOC 2 Type II, and TISAX certified"
      },
      "license-architecture": {
        "level": "none",
        "text": "Annual terms; enterprise contract based on site and volume"
      },
      "custom-dev": {
        "level": "partial",
        "text": "Paid services for TMS integrations and gate hardware"
      },
      "onboarding-structure": {
        "level": "partial",
        "text": "Managed network implementation and carrier onboarding"
      },
      "support-slas": {
        "level": "full",
        "text": "Global support with regional SLA commitments"
      },
      "scheduling-intelligence": {
        "level": "none",
        "text": "Manual overrides; basic tender exception log"
      },
      "live-chat": {
        "level": "partial",
        "text": "Automated carrier alerts and status updates"
      }
    }
  },
  {
    "id": "trucksonthemap",
    "name": "TrucksOnTheMap",
    "tagline": "Basic visual scheduling",
    "tier": "lightweight",
    "features": {
      "onboarding-model": {
        "level": "full",
        "text": "Carrier portal register or email invite"
      },
      "portal-visibility": {
        "level": "standout",
        "text": "Invite-only carrier portal with integrated AI backhaul load matching"
      },
      "mandatory-fields": {
        "level": "none",
        "text": "Not available"
      },
      "capacity-control": {
        "level": "none",
        "text": "No automated slot capacity limits"
      },
      "scheduling-rules": {
        "level": "full",
        "text": "Rules by door, load type, direction, and buffer"
      },
      "auto-approve": {
        "level": "full",
        "text": "Auto-approves pre-committed carrier slots"
      },
      "drag-drop": {
        "level": "none",
        "text": "Manual record edits; no interactive grid"
      },
      "schedule-views": {
        "level": "partial",
        "text": "Basic day and week calendar views"
      },
      "mobile-app": {
        "level": "partial",
        "text": "Mobile browser view only; no native app"
      },
      "bulk-scheduling": {
        "level": "none",
        "text": "No bulk import or recurring appointment rules"
      },
      "duration-calc": {
        "level": "none",
        "text": "No duration calculation engine available"
      },
      "driver-self-checkin": {
        "level": "full",
        "text": "OCR, RFID, and mobile app driver check-in"
      },
      "gate-guard-checkin": {
        "level": "partial",
        "text": "Basic gate arrival logging via telematics"
      },
      "unscheduled-workins": {
        "level": "partial",
        "text": "Manual record entry for unscheduled arrivals"
      },
      "load-po-matching": {
        "level": "none",
        "text": "No PO validation or load matching support"
      },
      "yard-jockey": {
        "level": "none",
        "text": "No yard jockey or trailer move tasking"
      },
      "yard-visibility": {
        "level": "partial",
        "text": "Yard helicopter view; color-coded by status/dwell"
      },
      "carrier-scorecarding": {
        "level": "none",
        "text": "No carrier scorecarding or compliance metrics"
      },
      "performance-reporting": {
        "level": "none",
        "text": "No performance analytics or KPI reporting"
      },
      "detention-tracking": {
        "level": "partial",
        "text": "Basic gate timestamping; no detention engine"
      },
      "inspection-checklists": {
        "level": "none",
        "text": "No load inspection checklists available"
      },
      "wms-tms-erp": {
        "level": "partial",
        "text": "Connects to fleet management, telematics, and basic YMS"
      },
      "api-maturity": {
        "level": "partial",
        "text": "REST API for location data, asset tracking, and schedules"
      },
      "webhook-triggers": {
        "level": "partial",
        "text": "Webhooks on geofence breaches and gate check-ins"
      },
      "edi-iot": {
        "level": "full",
        "text": "Real-time GPS telematics and automated vehicle tracking"
      },
      "data-import-export": {
        "level": "partial",
        "text": "CSV import and export for schedules and tracking logs"
      },
      "multi-site": {
        "level": "partial",
        "text": "Multi-location site tracking and yard oversight"
      },
      "rbac": {
        "level": "none",
        "text": "Standard roles (Dispatcher, Gate Guard, Admin)"
      },
      "sso-iam": {
        "level": "none",
        "text": "Standard OAuth login; custom SSO available on request"
      },
      "audit-trails": {
        "level": "none",
        "text": "Yard and gate execution logs for asset movements"
      },
      "security-certs": {
        "level": "none",
        "text": "GDPR compliant; hosted on cloud infrastructure"
      },
      "license-architecture": {
        "level": "full",
        "text": "No minimum commitment; pay-per-use model"
      },
      "custom-dev": {
        "level": "partial",
        "text": "Custom telematics and hardware gate integrations"
      },
      "onboarding-structure": {
        "level": "partial",
        "text": "Guided remote onboarding for telematics and mapping"
      },
      "support-slas": {
        "level": "partial",
        "text": "Direct phone and email support during operational hours"
      },
      "scheduling-intelligence": {
        "level": "none",
        "text": "Telematics alerts; no dock intelligence"
      },
      "live-chat": {
        "level": "partial",
        "text": "Basic tracking updates; no carrier dispatcher chat"
      }
    }
  },
  {
    "id": "timify",
    "name": "TIMIFY",
    "tagline": "General appointment booking tool",
    "tier": "lightweight",
    "features": {
      "onboarding-model": {
        "level": "partial",
        "text": "Standard generic booking form"
      },
      "portal-visibility": {
        "level": "partial",
        "text": "Carriers view standard resource time slots"
      },
      "mandatory-fields": {
        "level": "partial",
        "text": "Basic custom fields"
      },
      "capacity-control": {
        "level": "partial",
        "text": "Resource booking limits per time slot"
      },
      "scheduling-rules": {
        "level": "partial",
        "text": "Resource dependency and booking rule engine"
      },
      "auto-approve": {
        "level": "partial",
        "text": "Global toggle for auto-confirm or manual review"
      },
      "drag-drop": {
        "level": "partial",
        "text": "Visual grid edits with basic conflict alerts"
      },
      "schedule-views": {
        "level": "full",
        "text": "Day, week, month, and resource Gantt views"
      },
      "mobile-app": {
        "level": "full",
        "text": "Native iOS and Android mobile apps"
      },
      "bulk-scheduling": {
        "level": "partial",
        "text": "Recurring serial appointments and group bookings"
      },
      "duration-calc": {
        "level": "partial",
        "text": "Service buffer times; no load calculation"
      },
      "driver-self-checkin": {
        "level": "none",
        "text": "No driver check-in functionality"
      },
      "gate-guard-checkin": {
        "level": "none",
        "text": "No gate guard management tools"
      },
      "unscheduled-workins": {
        "level": "full",
        "text": "Virtual queue module for walk-in arrivals"
      },
      "load-po-matching": {
        "level": "none",
        "text": "No freight PO or shipment matching"
      },
      "yard-jockey": {
        "level": "none",
        "text": "No yard jockey tasking support"
      },
      "yard-visibility": {
        "level": "none",
        "text": "No yard visibility tools available"
      },
      "carrier-scorecarding": {
        "level": "none",
        "text": "No carrier performance or SLA tracking"
      },
      "performance-reporting": {
        "level": "none",
        "text": "No dock performance or throughput reports"
      },
      "detention-tracking": {
        "level": "none",
        "text": "No detention or dwell time tracking"
      },
      "inspection-checklists": {
        "level": "none",
        "text": "No load inspection or QA form tools"
      },
      "wms-tms-erp": {
        "level": "none",
        "text": "M365/Google Workspace connectors; custom ERP API links"
      },
      "api-maturity": {
        "level": "partial",
        "text": "REST API with documentation and interactive explorer"
      },
      "webhook-triggers": {
        "level": "partial",
        "text": "Webhooks for booking creation, changes, and cancellations"
      },
      "edi-iot": {
        "level": "none",
        "text": "Tablet check-in and digital signage only; no EDI support"
      },
      "data-import-export": {
        "level": "partial",
        "text": "CSV customer lists import; CSV/Excel/iCal export"
      },
      "multi-site": {
        "level": "partial",
        "text": "Multi-branch module for central site administration"
      },
      "rbac": {
        "level": "partial",
        "text": "Granular permissions across roles and resource calendars"
      },
      "sso-iam": {
        "level": "partial",
        "text": "SAML 2.0 SSO (Okta, Azure AD) available on Enterprise"
      },
      "audit-trails": {
        "level": "partial",
        "text": "System activity logs tracking logins and bookings"
      },
      "security-certs": {
        "level": "full",
        "text": "ISO 27001 certified; GDPR compliant"
      },
      "license-architecture": {
        "level": "none",
        "text": "Monthly terms; per-resource or user seat tiering"
      },
      "custom-dev": {
        "level": "none",
        "text": "Open API and app marketplace; no core development"
      },
      "onboarding-structure": {
        "level": "none",
        "text": "Self-serve standard; dedicated managers for enterprise"
      },
      "support-slas": {
        "level": "none",
        "text": "Standard email tickets; priority access for enterprise"
      },
      "scheduling-intelligence": {
        "level": "none",
        "text": "Slot availability only; no exception logic"
      },
      "live-chat": {
        "level": "partial",
        "text": "Automated email and SMS booking reminders"
      }
    }
  },
  {
    "id": "yardview",
    "name": "YardView",
    "tagline": "Yard-focused platform",
    "tier": "dedicated",
    "features": {
      "onboarding-model": {
        "level": "partial",
        "text": "Manual portal setup by yard team"
      },
      "portal-visibility": {
        "level": "partial",
        "text": "Carriers view scheduled appointments and status"
      },
      "mandatory-fields": {
        "level": "partial",
        "text": "Basic fields"
      },
      "capacity-control": {
        "level": "partial",
        "text": "Max trailer occupancy and door availability limits"
      },
      "scheduling-rules": {
        "level": "partial",
        "text": "Basic door assignment and yard schedule rules"
      },
      "auto-approve": {
        "level": "partial",
        "text": "Manual sign-off or gate trigger confirmation"
      },
      "drag-drop": {
        "level": "none",
        "text": "Yard task list updates; no visual dock grid"
      },
      "schedule-views": {
        "level": "full",
        "text": "Dock dashboards, timeline, and occupancy map"
      },
      "mobile-app": {
        "level": "full",
        "text": "Native iOS and Android yard mobile apps"
      },
      "bulk-scheduling": {
        "level": "partial",
        "text": "Manifest CSV import; no recurring booking engine"
      },
      "duration-calc": {
        "level": "none",
        "text": "Fixed appointment slot lengths by default"
      },
      "driver-self-checkin": {
        "level": "full",
        "text": "Personal device, QR, and kiosk driver check-in"
      },
      "gate-guard-checkin": {
        "level": "full",
        "text": "Gate control with blind seal verification"
      },
      "unscheduled-workins": {
        "level": "full",
        "text": "Unscheduled yard staging queue and door assignment"
      },
      "load-po-matching": {
        "level": "full",
        "text": "SKU and PO integration via WMS/ERP links"
      },
      "yard-jockey": {
        "level": "full",
        "text": "Prioritized yard driver tasking via mobile app"
      },
      "yard-visibility": {
        "level": "standout",
        "text": "Real-time interactive visual yard inventory map and trailer positioning"
      },
      "carrier-scorecarding": {
        "level": "partial",
        "text": "Dwell and arrival benchmarking; no scorecard app"
      },
      "performance-reporting": {
        "level": "full",
        "text": "Yard KPI dashboards and dwell time reports"
      },
      "detention-tracking": {
        "level": "full",
        "text": "Automated detention fee rules and dwell alerts"
      },
      "inspection-checklists": {
        "level": "partial",
        "text": "Exterior trailer condition and seal verification audits"
      },
      "wms-tms-erp": {
        "level": "full",
        "text": "Integrates with SAP, Manhattan, and Blue Yonder"
      },
      "api-maturity": {
        "level": "full",
        "text": "REST API for yard queries, doors, and gate events"
      },
      "webhook-triggers": {
        "level": "full",
        "text": "Webhooks for gate check-ins, trailer moves, and door status"
      },
      "edi-iot": {
        "level": "full",
        "text": "Gateway EDI 214/211; tablets, RFID, and yard tech"
      },
      "data-import-export": {
        "level": "full",
        "text": "CSV and Excel import for manifests; export to CSV/Excel"
      },
      "multi-site": {
        "level": "partial",
        "text": "Multi-yard dashboard for cross-site inventory"
      },
      "rbac": {
        "level": "partial",
        "text": "Site and role controls (Admin, Manager, Guard, Jockey)"
      },
      "sso-iam": {
        "level": "partial",
        "text": "SAML 2.0 SSO supported for corporate users"
      },
      "audit-trails": {
        "level": "full",
        "text": "History logs for trailer moves, doors, and gate events"
      },
      "security-certs": {
        "level": "partial",
        "text": "Hosted on SOC 2 compliant cloud infrastructure"
      },
      "license-architecture": {
        "level": "full",
        "text": "Annual terms; per-facility license with unlimited users"
      },
      "custom-dev": {
        "level": "partial",
        "text": "Paid custom development for yard logic and reporting"
      },
      "onboarding-structure": {
        "level": "full",
        "text": "Hands-on operational onboarding and live shift training"
      },
      "support-slas": {
        "level": "full",
        "text": "Direct phone and email access to yard specialists"
      },
      "scheduling-intelligence": {
        "level": "none",
        "text": "Manual yard overrides; no dock exception AI"
      },
      "live-chat": {
        "level": "partial",
        "text": "Automated driver SMS; no carrier dispatcher chat"
      }
    }
  },
  {
    "id": "arrivy",
    "name": "Arrivy",
    "tagline": "Field service & dispatch tool",
    "tier": "lightweight",
    "features": {
      "onboarding-model": {
        "level": "partial",
        "text": "Guest link or dispatcher invitation"
      },
      "portal-visibility": {
        "level": "partial",
        "text": "Carriers view predefined task booking slots"
      },
      "mandatory-fields": {
        "level": "none",
        "text": "Not available"
      },
      "capacity-control": {
        "level": "partial",
        "text": "Task count and time window capacity limits"
      },
      "scheduling-rules": {
        "level": "partial",
        "text": "Task scheduling rules and team availability"
      },
      "auto-approve": {
        "level": "full",
        "text": "Rule-based auto-assignment and confirmation"
      },
      "drag-drop": {
        "level": "full",
        "text": "Visual grid editing with active guardrail alerts"
      },
      "schedule-views": {
        "level": "full",
        "text": "List, calendar, resource Gantt, and map views"
      },
      "mobile-app": {
        "level": "full",
        "text": "Native iOS and Android field crew apps"
      },
      "bulk-scheduling": {
        "level": "full",
        "text": "Bulk task import via CSV template upload"
      },
      "duration-calc": {
        "level": "none",
        "text": "Fixed task duration blocks without load math"
      },
      "driver-self-checkin": {
        "level": "full",
        "text": "Mobile QR code and tablet driver check-in"
      },
      "gate-guard-checkin": {
        "level": "none",
        "text": "No gate guard management tools"
      },
      "unscheduled-workins": {
        "level": "full",
        "text": "Unscheduled task planning queue for ad-hoc jobs"
      },
      "load-po-matching": {
        "level": "partial",
        "text": "ERP sales order sync and photo proof matching"
      },
      "yard-jockey": {
        "level": "partial",
        "text": "Generic task dispatch; no trailer drop/hook flows"
      },
      "yard-visibility": {
        "level": "partial",
        "text": "Dispatch map view for crews; no yard layout map"
      },
      "carrier-scorecarding": {
        "level": "none",
        "text": "No carrier performance scorecarding"
      },
      "performance-reporting": {
        "level": "partial",
        "text": "Field task reports; no dock throughput metrics"
      },
      "detention-tracking": {
        "level": "partial",
        "text": "Basic job timestamping; no detention engine"
      },
      "inspection-checklists": {
        "level": "full",
        "text": "Custom digital inspection forms with photos"
      },
      "wms-tms-erp": {
        "level": "partial",
        "text": "Integrates via Zapier, Make, and native field tools"
      },
      "api-maturity": {
        "level": "partial",
        "text": "Public REST API for tasks, bookings, and customer records"
      },
      "webhook-triggers": {
        "level": "partial",
        "text": "Webhooks for task status (En Route, Checked In, Done)"
      },
      "edi-iot": {
        "level": "none",
        "text": "Mobile GPS tracking only; no EDI or industrial hardware"
      },
      "data-import-export": {
        "level": "partial",
        "text": "Bulk CSV upload for tasks; export to CSV and JSON"
      },
      "multi-site": {
        "level": "partial",
        "text": "Multi-team and territory grouping under central account"
      },
      "rbac": {
        "level": "partial",
        "text": "Pre-defined roles (Admin, Dispatcher, Crew, Viewer)"
      },
      "sso-iam": {
        "level": "partial",
        "text": "Google/Microsoft SSO; SAML on top-tier plans"
      },
      "audit-trails": {
        "level": "partial",
        "text": "Activity logs attached to individual job and task records"
      },
      "security-certs": {
        "level": "partial",
        "text": "GDPR compliant; AWS SOC 2 Type II certified cloud"
      },
      "license-architecture": {
        "level": "partial",
        "text": "Monthly terms; per-user or monthly job volume tiering"
      },
      "custom-dev": {
        "level": "partial",
        "text": "Standard APIs; custom UI evaluated against roadmap"
      },
      "onboarding-structure": {
        "level": "partial",
        "text": "Guided remote onboarding with customer success reps"
      },
      "support-slas": {
        "level": "partial",
        "text": "Email, chat, and ticket support during business hours"
      },
      "scheduling-intelligence": {
        "level": "partial",
        "text": "Conflict prevention and rule constraint checks"
      },
      "live-chat": {
        "level": "standout",
        "text": "Two-way dispatcher chat and shared task journal"
      }
    }
  },
  {
    "id": "prodocks",
    "name": "ProDocks",
    "tagline": "Simple and very limited calendar tool",
    "tier": "lightweight",
    "features": {
      "onboarding-model": {
        "level": "partial",
        "text": "Link-based self-booking; no login"
      },
      "portal-visibility": {
        "level": "partial",
        "text": "Carriers view open daily slots via web form"
      },
      "mandatory-fields": {
        "level": "none",
        "text": "Not available"
      },
      "capacity-control": {
        "level": "none",
        "text": "No capacity restriction engine"
      },
      "scheduling-rules": {
        "level": "none",
        "text": "No scheduling rules engine available"
      },
      "auto-approve": {
        "level": "none",
        "text": "Direct calendar entry without approval queue"
      },
      "drag-drop": {
        "level": "none",
        "text": "Static record forms; no interactive grid"
      },
      "schedule-views": {
        "level": "partial",
        "text": "Daily schedule list and basic calendar view"
      },
      "mobile-app": {
        "level": "none",
        "text": "Desktop web form; no mobile optimization"
      },
      "bulk-scheduling": {
        "level": "none",
        "text": "No bulk upload or recurring schedule tools"
      },
      "duration-calc": {
        "level": "none",
        "text": "Static time slots; no duration calculation"
      },
      "driver-self-checkin": {
        "level": "full",
        "text": "QR code check-in kiosk for drivers"
      },
      "gate-guard-checkin": {
        "level": "none",
        "text": "No gate guard interface"
      },
      "unscheduled-workins": {
        "level": "partial",
        "text": "Manual entry of unscheduled trucks on daily grid"
      },
      "load-po-matching": {
        "level": "none",
        "text": "No PO matching or load validation"
      },
      "yard-jockey": {
        "level": "none",
        "text": "No yard jockey management"
      },
      "yard-visibility": {
        "level": "none",
        "text": "No yard mapping functionality"
      },
      "carrier-scorecarding": {
        "level": "none",
        "text": "No carrier compliance or performance logs"
      },
      "performance-reporting": {
        "level": "partial",
        "text": "Basic booking export; no KPI dashboards"
      },
      "detention-tracking": {
        "level": "none",
        "text": "No detention or dwell tracking capabilities"
      },
      "inspection-checklists": {
        "level": "none",
        "text": "No load inspection forms or checklists"
      },
      "wms-tms-erp": {
        "level": "none",
        "text": "Limited native ERP connectors; relies on Web APIs"
      },
      "api-maturity": {
        "level": "none",
        "text": "Basic REST API for appointments and site availability"
      },
      "webhook-triggers": {
        "level": "none",
        "text": "Basic webhook support for new booking notifications"
      },
      "edi-iot": {
        "level": "none",
        "text": "Touchscreen kiosk and QR scanning only; no EDI support"
      },
      "data-import-export": {
        "level": "none",
        "text": "CSV import for schedules; CSV export for booking logs"
      },
      "multi-site": {
        "level": "none",
        "text": "Basic multi-location grouping under single billing"
      },
      "rbac": {
        "level": "none",
        "text": "Pre-defined role tiers (Admin, Facility User, Viewer)"
      },
      "sso-iam": {
        "level": "none",
        "text": "Standard email/password login; no SAML SSO"
      },
      "audit-trails": {
        "level": "none",
        "text": "Basic timestamp logging for booking changes"
      },
      "security-certs": {
        "level": "none",
        "text": "Standard TLS encryption; GDPR compliant"
      },
      "license-architecture": {
        "level": "standout",
        "text": "The only product with a permanent free single-warehouse tier"
      },
      "custom-dev": {
        "level": "none",
        "text": "Custom feature development unavailable"
      },
      "onboarding-structure": {
        "level": "none",
        "text": "Self-serve setup via online documentation"
      },
      "support-slas": {
        "level": "none",
        "text": "Email ticketing during business hours"
      },
      "scheduling-intelligence": {
        "level": "none",
        "text": "Static booking grid; no exception tracking"
      },
      "live-chat": {
        "level": "partial",
        "text": "Automated SMS and email booking notifications"
      }
    }
  }
];
