import type { PageContent } from "@/data/types";

// Images
import dashboardPreview from "@/assets/dashboard-preview.webp";
import digiHeader from "@/assets/solutionsscreenshots/digitization/dashboardheader.webp";
import digi1 from "@/assets/solutionsscreenshots/digitization/appointmentscreated.webp";
import digi2 from "@/assets/solutionsscreenshots/digitization/arrivedontime.webp";
import digi3 from "@/assets/solutionsscreenshots/digitization/combinedontime.webp";
import digi4 from "@/assets/solutionsscreenshots/digitization/completedontime.webp";
import digi5 from "@/assets/solutionsscreenshots/digitization/earlyappointments.webp";
import digi6 from "@/assets/solutionsscreenshots/digitization/lateappointments.webp";

export const defaultContent: PageContent = {
  hero: {
    badgeText: "More Than 1,000,000 Appointments Booked Annually!",
    headline: "GET ACTIONABLE DATA ABOUT EVERYTHING THAT COMES THROUGH YOUR DOCKS",
    emailPlaceholder: "Enter your work email",
    buttonText: "Get Free Demo",
    dashboardAlt: "Dashboard showing appointment analytics, dock statistics, and peak booking times",
    desktopImage: dashboardPreview, 
  },
  digitizeGallery: {
    header: digiHeader,
    gridImages: [digi1, digi2, digi3, digi4, digi5, digi6] 
  },
  credibility: {
    g2Rating: "4.9/5 on G2",
    g2Link: "https://www.g2.com/products/datadocks/reviews",
    uptimePercentage: "99.99%",
    uptimeLabel: "Uptime",
    capterraLink: "https://www.capterra.com/p/179266/DataDocks/",
    capterraRating: "4.9",
    supportHours: "24/7",
    supportLabel: "Support",
    securityBadges: { iso: "ISO", isoSubtext: "27001", gdpr: "GDPR", soc2: "SOC 2", soc2Subtext: "TYPE II", },
  },
  testimonial: {
    quote: "A little over a year in and I couldn't imagine going back to the old ways of using spreadsheets to manage our shipping schedule.",
    name: "Nick Steinman",
    role: "Warehouse Supervisor, Food Industry",
    image: "/src/assets/nick-steinman.jpg",
  },
  benefits: {
    benefits: [
      { icon: "calendar", title: "Carrier Self-Service", description: "Cut 80% of calls and emails by having customers and carriers book.", },
      { icon: "database", title: "Upgrade Your Systems", description: "Get richer, cleaner data into your TMS, WMS or ERP", },
      { icon: "barChart", title: "Scale Effortlessly", description: "Pull reports on your carriers and your own operations.", },
      { icon: "users", title: "Team Collaboration", description: "Promote your logistics coordinator to a process optimizer", },
      { icon: "fileCheck", title: "Digital Audit Trail", description: "Get time-stamped logs and low friction SOC2 & GDPR Compliance.", },
      { icon: "archive", title: "Standardize Processes", description: "Set up required fields and documentation for every load", },
    ],
  },
  howItWorks: {
    title: "HOW IT WORKS",
    subtitle: "Say goodbye to spreadsheets, calls and emails.",
    steps: [
      {
        stepNumber: 1,
        title: "Unify Your Inputs",
        description: "Bulk upload your POs, or feed in data through EDI, API, or manual entry.",
        icon: "upload",
        desktopAnnotation: "Stop booking appointments on behalf of your customers!",
        mobileAnnotation: "Stop booking appointments on behalf of your customers!",
        visualTags: ["EDI", "API", "CSV"],
      },
      {
        stepNumber: 2,
        title: "Manage by Exception",
        description: "Just mark loads as arrived or departed and instantly get reports you can use.",
        icon: "toggle",
        mobileAnnotation: "It all comes down to getting stuff off your plate.",
        highlight: true,
      },
      {
        stepNumber: 3,
        title: "Automate the Rest",
        description: "The more you use the system, the more you can automate.",
        icon: "refresh",
      },
    ],
    footerAnnotation: "💡 Logic: (It all comes down to getting stuff off your plate)",
  },
  caseStudies: {
    caseStudies: [
      { 
        company: "Honeyville, Inc.", 
        industry: "Food Wholesale", 
        metricValue: "83%", 
        metricLabel: "Fewer Emails", 
        challenge: "The logistics coordinator was swamped with calls and upwards of 120 emails a day, managing the schedule from an Outlook calendar. This reactive process left no time to optimize schedules or prepare the receiving team for incoming shipments.", 
        result: "DataDocks centralized the schedule, cutting daily email volume to less than 20. This clarity allows the team to staff appropriately and prepare documentation in advance, transitioning the department from reactive fire-fighting to proactive logistics planning.", 
      },
      { 
        company: "ShipMonk", 
        industry: "E-commerce 3PL", 
        metricValue: "90%", 
        metricLabel: "Calcs Eliminated", 
        challenge: "To maximize dock utilization, coordinators were forced to manually calculate capacity limits and appointment durations for every single booking. This manual math was slow, prone to error, and led to appointment rejections during crunch times.", 
        result: "DataDocks automated the logic. The system now instantly calculates the perfect slot length for every load type based on ShipMonk's specific rules. This eliminated 90% of manual computations, freeing the team to focus on merchant experience instead of spreadsheet math.", 
      },
    ],
  },
  faq: {
    faqs: [
      { question: "How does dock scheduling data connect with our WMS, TMS, or ERP systems?", answer: "We can connect via API or EDI if you want to streamline data entry, sync POs, or trigger workflows in your other systems automatically.", },
      { question: "Can we exchange data through EDI, or does it use another format?", answer: "We support modern APIs for real-time flexibility, but we also handle standard EDI formats (like 204s and 214s) to ensure compatibility with legacy systems and large enterprise partners.", },
      { question: "How does time-stamped event tracking actually work in practice?", answer: "Transparency is key. Every single status change, from 'Scheduled' to 'Arrived' to 'Departed' is logged with a timestamp and the user ID of the person who made the change.", },
      { question: "What kinds of reports or dashboards are available straight out of the system?", answer: "You get immediate access to operational dashboards showing daily throughput, carrier on-time performance, and average duration. It gives you a high-level health check of your facility without any setup.", },
      { question: "Which KPIs are automatically tracked, and which ones will we still define ourselves?", answer: "We track the operational timeline automatically (Wait Times, Turnaround). You define the business context, such as which carriers are 'preferred' or what constitutes a compliant delivery for your specific site.", },
      { question: "How accurate is the data for audit or compliance use?", answer: "Because the system maintains a complete audit trail of every edit and status change, the data is incredibly reliable for resolving detention fee disputes or passing compliance audits.", },
      { question: "How can this help us find recurring causes of delay or inefficiency?", answer: "Digital records reveal patterns. You might spot that a specific carrier is chronically late, or that a certain shift consistently runs overtime. The data helps you move from 'gut feeling' to root-cause analysis.", },
      { question: "What’s the best way to measure loading dock performance across multiple sites?", answer: "Digitization creates a standard. You can report on multiple facilities using the same metrics, making it easy to benchmark high-performing sites against those that need attention, regardless of their volume.", },
      { question: "How can digital data support a continuous-improvement loop instead of one-off reviews?", answer: "It allows for agility. Instead of waiting for a quarterly review, you can monitor weekly trends in dwell time or capacity usage and make small, data-driven adjustments to your rules immediately.", },
      { question: "How can dock-level metrics feed into broader supply-chain visibility tools?", answer: "If you use enterprise visibility platforms, we can feed our timestamp data directly to them. This fills the 'black hole' of the yard, giving your broader network accurate visibility into when goods actually arrived or departed.", },
      { question: "What role could this play in a digital-twin or predictive-planning project down the line?", answer: "Your historical dock data serves as the 'training set.' Over time, this data allows predictive models to simulate how changes in layout or labor would impact your actual throughput.", },
      { question: "How do we make a clear business case for digitizing dock operations and prove the ROI?", answer: "Start with the hard costs: reduction in detention fees (proven by accurate timestamps) and admin hours saved (scheduling automation). Most facilities see ROI in under 6 months through these two savings alone. The larger, long-term value comes from the operational efficiency you unlock with better data.", },
    ],
  },
};