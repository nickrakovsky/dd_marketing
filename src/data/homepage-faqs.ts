/*
  FAQ set used by the noindexed keyword landing pages. Mirrors the array defined
  inline in src/pages/index.astro — kept as a separate copy so the homepage file
  stays untouched. If the homepage FAQs change, update this to match.
*/
export interface HomepageFaq {
  question: string;
  answer: string;
}

export const homepageFaqs: HomepageFaq[] = [
  {
    question: "What is dock scheduling software?",
    answer: "Dock scheduling software automates the process of assigning time slots and dock doors to inbound and outbound trucks. It replaces spreadsheets and phone calls with a self-service carrier portal, automated notifications, and real-time visibility into dock operations."
  },
  {
    question: "What is a yard management system (YMS)?",
    answer: "A yard management system (YMS) tracks trailers and containers in the yard of a warehouse or distribution center. It provides real-time trailer locations, automates gate check-in, coordinates yard driver tasks, and manages dock door assignments. Facilities use YMS to reduce detention fees, prevent lost trailers, and improve flow from gate to dock."
  },
  {
    question: "What is the difference between dock scheduling and yard management?",
    answer: "Dock scheduling controls appointments — when trucks arrive and which door they're assigned to. Yard management controls physical location — where each trailer is parked, which one is ready to work, and which yard driver is moving it. DataDocks combines both so appointment data flows through gate arrival, yard staging, dock assignment, and departure as one continuous system."
  },
  {
    question: "How much does DataDocks cost?",
    answer: "DataDocks offers flexible pricing with no minimum contract. Contact us for a custom quote based on your facility size and number of locations. Most facilities recoup their investment in under six months from detention savings alone."
  },
  {
    question: "How long does it take to set up DataDocks?",
    answer: "DataDocks can be deployed in weeks, not months. The platform is cloud-based with no hardware installation required. Our team provides comprehensive onboarding to ensure both your staff and your carriers are up and running quickly."
  },
  {
    question: "Does DataDocks integrate with my WMS or ERP?",
    answer: "Yes. DataDocks integrates with leading WMS, TMS, and ERP systems including SAP, Oracle NetSuite, Blue Yonder, and Manhattan Associates via REST API. Custom integrations are also available."
  },
  {
    question: "What results can I expect from dock scheduling software?",
    answer: "Facilities using DataDocks typically see a 40-60% reduction in detention fees within the first quarter, 10-15% throughput increases without adding doors or staff, and coordinators recovering 10-15 hours per week previously spent on phone and email scheduling."
  },
  {
    question: "Does DataDocks have a mobile app?",
    answer: "Yes. DataDocks offers native iOS and Android apps for internal warehouse teams. Managers and coordinators can view schedules, transition appointments, capture photos for QC checks, and receive push notifications — all from the dock floor without walking back to a desk."
  }
];
