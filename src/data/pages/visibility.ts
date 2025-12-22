import { defaultContent } from "./digitize";
import type { PageContent } from "@/data/types";

// Specific Assets
import visBase from "@/assets/solutionsscreenshots/visibility/propertyview.webp";
import visOverlay from "@/assets/solutionsscreenshots/visibility/appscreenshot1.webp";
import visGallery2 from "@/assets/solutionsscreenshots/visibility/appscreenshot2.webp";
import visGallery3 from "@/assets/solutionsscreenshots/visibility/appscreenshot3.webp"; 
import visGallery4 from "@/assets/solutionsscreenshots/visibility/appscreenshot4.webp";
import visGallery5 from "@/assets/solutionsscreenshots/visibility/appscreenshot5.webp";

export const yardappContent: PageContent = {
  ...defaultContent,
  digitizeGallery: undefined,
  hero: {
    ...defaultContent.hero,
    headline: "SEE WHAT’S AT YOUR DOCKS, ON THE WAY, OR IN YOUR YARD, AND MANAGE IT ALL FROM THE APP",
    emailPlaceholder: "Enter your work email",
    buttonText: "Get Free Demo",
    dashboardAlt: "Visibility Dashboard",
  },
  visibilityGallery: {
    baseImage: visBase,
    overlayImage: visOverlay,
    galleryImages: [visOverlay, visGallery2, visGallery3, visGallery4, visGallery5]
  },
  howItWorks: {
    title: "HOW IT WORKS",
    subtitle: "Spot the bottlenecks in your docks and yard.",
    steps: [
      {
        stepNumber: 1,
        title: "Standardize Intake",
        description: "Make specific fields (like PO#) or documents mandatory so you can always identify a load the moment it arrives.",
        icon: "upload",
        visualTags: ["Mandatory Fields", "Docs"],
        mobileAnnotation: "Configurable Alert: 'Detention risk detected' — lets you pivot before fees accrue.",
      },
      {
        stepNumber: 2,
        title: "Automate Alerts",
        description: "When anyone requests a schedule change, notifications trigger instantly—keeping your dock and yard teams in sync.",
        icon: "toggle",
        desktopAnnotation: "Configurable Alert: 'Detention risk detected' — lets you pivot before fees accrue.",
        mobileAnnotation: "Result: Your gate, yard, and dock teams finally see the same reality.",
        highlight: true,
      },
      {
        stepNumber: 3,
        title: "Smooth the Flow",
        description: "The algorithm spreads appointments out to match your daily capacity, preventing bottlenecks before they form.",
        icon: "refresh",
      },
    ],
    footerAnnotation: "💡 Result: Your gate, yard, and dock teams finally see the same reality."
  },
  testimonial: {
    quote: "We can look ahead at what’s scheduled, prepare any required documentation in advance, and appropriately staff our team. It’s already saved us so much time.",
    name: "Marcasa Ahlstrom",
    role: "Transportation Manager, Honeyville Inc.",
    image: "/src/assets/honeyvillelogo.webp",
  }, 
  benefits: {
    benefits: [
      { icon: "barChart", title: "Live ETAs & Smart Alerts", description: "Auto-ETA refresh, notifications, and real-time board visibility.", },
      { icon: "archive", title: "Mobile Load Info", description: "Check who/what/PO/ASN in the app in one tap.", },
      { icon: "users", title: "Improve Yard Flow", description: "Order jockey moves and let drivers check themselves in.", },
      { icon: "calendar", title: "Quick Workload Forecast", description: "See what’s coming in later and plan proactively.", },
      { icon: "database", title: "Smart Door Assignment", description: "Automatically check for conflicts and resequence based on load data.", },
      { icon: "fileCheck", title: "Easy Inspections", description: "Access checklists and packing lists in-app or printable.", },
    ],
  },
  caseStudies: {
    caseStudies: [
      { 
        company: "Verst Group", 
        industry: "Contract Logistics", 
        metricValue: "Zero", 
        metricLabel: "Radio Chatter", 
        challenge: "The warehouse relied on physical whiteboards and constant radio communication to manage dock activity. This analog approach created information lags, resulting in confusion on the floor and endless noise just to confirm bay status.", 
        result: "By replacing the whiteboard with a large TV display powered by DataDocks, the team gained instant, live updates. This digital shift silenced the radios and ensured the floor team acts on live data, a change the Operations Manager describes as 'transformative' for daily operations.", 
      },
      { 
        company: "ShipMonk", 
        industry: "E-commerce 3PL", 
        metricValue: "12", 
        metricLabel: "Locations Managed", 
        challenge: "Managing inbound freight across 12 facilities was chaotic without data validation. Carriers frequently booked slots against incorrect or non-existent POs, leading to receiving errors and a flood of emails to verify deliveries.", 
        result: "DataDocks implemented an API bulk upload that restricts carriers to booking only against valid, real-time POs. This 'gatekeeper' function eliminated invalid bookings, drastically reduced email traffic, and provided leadership with high-level quality assurance.", 
      },
    ],
  },
  faq: {
    faqs: [
      { question: "How does the system show what’s coming in next so teams can plan ahead?", answer: "Our Schedule View serves as your daily timeline. It displays not just your time slots, but pallet counts, load types, and special handling needs.", },
      { question: "How does the system predict how long each appointment will take?", answer: "It combines historical averages with human oversight. The system suggests a duration based on load data.", },
      { question: "When a truck is delayed or early, how is that reflected in the live schedule?", answer: "The schedule is dynamic. Delayed trucks are visually flagged, letting your team see the gap in the schedule instantly.", },
      { question: "How are alerts set up so the right people get notified at the right time?", answer: "You can configure email notifications for key events like new bookings or cancellations. For active users, in-app notifications ensure they see important updates.", },
      { question: "How can the system show trailers waiting in the yard and flag ones that have been idle too long?", answer: "You can filter the schedule to see only trucks in the 'Arrived/Yard' status, and set up rules to flag any trailer that has sat waiting for longer.", },
      { question: "How does the system handle planned yard moves or jockey assignments?", answer: "You can issue digital tasks for yard jockeys, such as moving a specific trailer to a door or parking spot.", },
      { question: "How do supervisors access live information while they’re out on the floor?", answer: "We offer dedicated mobile apps for iOS and Android, and the web platform is tablet-friendly.", },
      { question: "How does the system display workload or door utilization throughout the day?", answer: "We work backward from capacity. You set constraints on appointments per hour or zone, and the system visualizes how close you are to those limits.", },
      { question: "What tools are there for managing inspections or safety checks?", answer: "You can attach digital forms and checklists directly to the appointment record, ensuring that safety checks and quality inspections are documented.", },
      { question: "How do drivers or carriers see their own status once they’ve checked in?", answer: "Dispatchers can view the real-time status of their drivers directly in the portal.", },
      { question: "What happens if there’s a data lag, or the wifi goes down?", answer: "The Schedule View remains accessible as a local snapshot, so your team knows what was planned. Once you’re back online, the system automatically syncs.", },
      { question: "How does better visibility actually speed up turnarounds and reduce waiting?", answer: "Preparation is everything. When the warehouse knows a floor-loaded container is arriving at 2 PM, they can stage the right labor and equipment beforehand.", },
    ],
  },
};