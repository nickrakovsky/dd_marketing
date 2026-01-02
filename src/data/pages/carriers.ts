import { defaultContent } from "./digitize";
import type { PageContent } from "@/data/types";

// Base & Mobile
import carPortal from "@/assets/solutionsscreenshots/carriers/portal2.webp";
import mobPortal1 from "@/assets/solutionsscreenshots/carriers/mobileportal1.webp";
import mobPortal2 from "@/assets/solutionsscreenshots/carriers/mobileportal2.webp";

// Gallery Details
import gal1 from "@/assets/solutionsscreenshots/carriers/carriergallery1.webp";
import gal2 from "@/assets/solutionsscreenshots/carriers/carriergallery2.webp";
import gal3 from "@/assets/solutionsscreenshots/carriers/carriergallery3.webp";
import gal4 from "@/assets/solutionsscreenshots/carriers/carriergallery4.webp";
import gal5 from "@/assets/solutionsscreenshots/carriers/carriergallery5.webp";

// Placeholder for Dashboard
import dashboardPreview from "@/assets/dashboard-preview.webp";
import landonMoreno from "@/assets/landonmoreno.webp";

export const carriersContent: PageContent = {
  ...defaultContent,
  digitizeGallery: undefined,
  carriersGallery: {
    masterImage: carPortal,
    mobileImages: [mobPortal1, mobPortal2],
    galleryImages: [gal1, gal2, gal3, gal4, gal5],
    hotspots: [
      { // HOTSPOT 1 (Top Left Main)
        left: "0.68%", top: "7.05%", width: "57.28%", height: "35.35%", targetIndex: 0 
      },
      { // HOTSPOT 2 (Bottom Left Main)
        left: "0.68%", top: "43.40%", width: "57.28%", height: "22.37%", targetIndex: 1 
      },
      { // HOTSPOT 3 (Top Right Strip)
        left: "58.43%", top: "7.05%", width: "40.78%", height: "18.79%", targetIndex: 2 
      },
      { // HOTSPOT 4 (Middle Right Strip)
        left: "58.43%", top: "26.85%", width: "40.78%", height: "24.27%", targetIndex: 3 
      },
      { // HOTSPOT 5 (Bottom Right Strip)
        left: "58.43%", top: "70.02%", width: "40.78%", height: "29.98%", targetIndex: 4 
      },
    ]
  },
  hero: {
    ...defaultContent.hero,
    headline: "MAKE IT EFFORTLESS FOR YOUR CARRIERS AND CUSTOMERS TO BOOK APPOINTMENTS",
    desktopImage: carPortal,
    mobileGallery: [
      { src: mobPortal1, alt: "Carrier Mobile View 1", style: 'centered' },
      { src: mobPortal2, alt: "Carrier Mobile View 2", style: 'centered' }
    ]
  },
  howItWorks: {
    title: "HOW IT WORKS",
    subtitle: "They book the appointments, you stay in control.",
    steps: [
      {
        stepNumber: 1,
        title: "Invite Partners",
        description: "Just share an invite link. Your partners onboard themselves and add their own drivers in minutes.",
        icon: "upload",
        visualTags: ["Self-Service", "Quick Setup"],
        mobileAnnotation: "No more back-and-forth negotiation.",
      },
      {
        stepNumber: 2,
        title: "Set Constraints",
        description: "You decide the mandatory docs and rules. Carriers only see time slots that actually work for their load type.",
        icon: "toggle",
        desktopAnnotation: "No more back-and-forth negotiation.",
        mobileAnnotation: "Insight: You even get turnaround KPIs for carriers that don't collaborate.",
        highlight: true,
      },
      {
        stepNumber: 3,
        title: "Auto-Approve",
        description: "The system validates the booking against your capacity and auto-approves it instantly.",
        icon: "refresh",
      },
    ],
    footerAnnotation: "💡 Insight: You even get turnaround KPIs for carriers that don't collaborate.",
  },
  testimonial: {
    quote: "A great help with keeping track of our appointments. I like that automatic email reminders and notices are sent to the trucking company that sets their appointments.",
    name: "Landon Moreno",
    role: "Logistics Operations Manager, Vee Express, LLC",
    image: landonMoreno,
  },
  benefits: {
    benefits: [
      { icon: "calendar", title: "Easy Onboarding", description: "Simple bookings portal with rules and required docs up front.", },
      { icon: "database", title: "Less Back-and-Forth", description: "Share docs and status in-system rather than on the phone.", },
      { icon: "barChart", title: "Fewer No-Shows", description: "Set automatic reminders, easy rescheduling and clear policies.", },
      { icon: "users", title: "Cut Detention Fees", description: "Prevent disputes with time-stamped check-in/outs.", },
      { icon: "fileCheck", title: "Compare Performance", description: "Use scorecards to improve carrier selection and management.", },
      { icon: "archive", title: "On-Time Incentives", description: "Prioritize scheduled arrivals and watch adherence improve", },
    ],
  },
  caseStudies: {
    caseStudies: [
      { 
        company: "Vee Express", 
        industry: "3PL & Packaging", 
        metricValue: "0", 
        metricLabel: "Late Disputes", 
        challenge: "Vee Express struggled with a lack of accountability when carriers arrived late. Without an objective system to track appointment times versus actual arrival times, the warehouse often faced disputes and liability for delays.", 
        result: "DataDocks provided an indisputable audit trail. By automatically emailing trucking companies the moment a driver is late, the system creates objective proof of performance, shifting responsibility back to the carriers and eliminating arguments.", 
      },
      { 
        company: "Nick Steinman", 
        industry: "Food Wholesale", 
        metricValue: "75%", 
        metricLabel: "Self-Service Bookings", 
        challenge: "Booking a single appointment was an administrative nightmare, requiring an average of five emails—and sometimes as many as 17—to finalize. This inefficient back-and-forth drained over 40 hours of admin time every week.", 
        result: "By shifting 75% of bookings to the self-service portal, the team virtually eliminated the email burden. This transition, combined with direct driver messaging, recovered a full work week’s worth of labor for the staff.", 
      },
    ],
  },
  faq: {
    faqs: [
      { question: "How do I convince my carriers to actually book through a scheduling system?", answer: "Carriers sometimes push back because they think scheduling is rigid. Explain it to them as a priority pass: booking a slot means they skip the 'first-come-first-served' line.", },
      { question: "What happens when a truck shows up outside its appointment window?", answer: "The system flags the arrival as 'Late' or 'Early,' allowing you to de-prioritize them and work them in around your on-time appointments.", },
      { question: "How do I make sure carriers understand the requirements before booking a load?", answer: "You can display custom instructions—such as safety protocols, PPE requirements, or delivery guides—directly in the booking portal.", },
      { question: "How are cancellations, reschedules, and no-shows tracked over time?", answer: "The system logs every status change in an immutable audit trail. You can generate reports based on these logs to identify frequency trends.", },
      { question: "How does the system handle different load types — live, drop, multi-stop cross-docking etc.?", answer: "You can configure custom appointment types with their own rules. A 'Live Load' might reserve 60 minutes, while a 'Drop' reserves 15.", },
      { question: "Can I connect dock data with my TMS to plan capacity more accurately?", answer: "Yes. A TMS integration can automatically push planned loads into the schedule so you can visualize capacity needs in advance.", },
      { question: "How can we make sure carriers get updates without noise or spam?", answer: "You can configure what actions trigger a notification and to whom. Plus, the system uses smart buffering.", },
      { question: "What metrics should I use to evaluate carrier performance?", answer: "On-Time Arrival (OTA) and Dwell Time are the big ones. Because the system tracks the exact difference between 'Scheduled' and 'Arrived,' you have objective data.", },
      { question: "Which KPIs will the system track for me automatically, and which need manual input?", answer: "The system automatically tracks all time-based metrics (Arrivals, Duration, Turnaround).", },
      { question: "How does collaboration work between shippers, carriers, and brokers inside the system?", answer: "It centralizes communication. You can chat within specific appointments, attach documents like BOLs, and trigger automated email notifications.", },
      { question: "How much visibility do carriers get into our calendar?", answer: "That is entirely up to you. They’ll see their own booking history, and you can show them all available slots or release only 'preferred' times.", },
      { question: "Where does the data for check-in and check-out timestamps come from?", answer: "It depends on your workflow. Drivers can check in via a tablet kiosk, guards can log them at the gate, or your internal coordinators can simply click 'Arrived'.", },
    ],
  },
};