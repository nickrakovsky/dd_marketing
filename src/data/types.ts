import type { ImageMetadata } from "astro";

export interface HeroSlide {
  type: "single" | "carousel";
  images: ImageMetadata[];
}

export interface HeroContent {
  badgeText: string;
  headline: string;
  emailPlaceholder: string;
  buttonText: string;
  dashboardAlt: string;
  heroSlides?: HeroSlide[];
  desktopImage?: ImageMetadata;
  mobileGallery?: { src: ImageMetadata; alt: string; style?: 'centered' | 'full' }[];
}

export interface DigitizeGalleryData {
  header: ImageMetadata;
  gridImages: ImageMetadata[];
}

export interface VisibilityGalleryData {
  baseImage: ImageMetadata;
  overlayImage: ImageMetadata;
  galleryImages: ImageMetadata[];
}

// UPDATED INTERFACE
export interface CapacityGalleryData {
  staticImage: ImageMetadata;
  overlayImage?: ImageMetadata; // Added this optional property
}

export interface CarriersGalleryData {
  masterImage: ImageMetadata;
  mobileImages: ImageMetadata[];
  galleryImages: ImageMetadata[];
  hotspots: {
    left: string;
    top: string;
    width: string;
    height: string;
    targetIndex: number;
  }[];
}

export interface CredibilityContent {
  g2Rating: string;
  g2Link: string;
  uptimePercentage: string;
  uptimeLabel: string;
  capterraLink: string;
  capterraRating: string;
  supportHours: string;
  supportLabel: string;
  securityBadges: {
    iso: string;
    isoSubtext: string;
    gdpr: string;
    soc2: string;
    soc2Subtext: string;
  };
}

export interface TestimonialContent {
  quote: string;
  name: string;
  role: string;
  image: ImageMetadata; 
}

export interface Benefit {
  icon: string;
  title: string;
  description: string;
}

export interface BenefitsContent {
  benefits: Benefit[];
}

export interface Step {
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  desktopAnnotation?: string;
  mobileAnnotation?: string;
  visualTags?: string[];
  highlight?: boolean;
}

export interface HowItWorksContent {
  title: string;
  subtitle: string;
  steps: Step[];
  footerAnnotation?: string;
}

export interface CaseStudy {
  company: string;
  industry: string;
  metricValue: string;
  metricLabel: string;
  challenge: string;
  result: string;
}

export interface CaseStudiesContent {
  caseStudies: CaseStudy[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQContent {
  faqs: FAQItem[];
}

export interface PageContent {
  hero: HeroContent;
  digitizeGallery?: DigitizeGalleryData;
  visibilityGallery?: VisibilityGalleryData;
  capacityGallery?: CapacityGalleryData;
  carriersGallery?: CarriersGalleryData;
  credibility: CredibilityContent;
  testimonial: TestimonialContent;
  benefits: BenefitsContent;
  howItWorks: HowItWorksContent;
  caseStudies: CaseStudiesContent;
  faq: FAQContent;
}