/** @jsxImportSource solid-js */
import { createSignal, createMemo } from "solid-js";

export interface YardTypeOption {
  id: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  details: {
    description: string;
    keyMetrics: string[];
    recommendedType: string;
  };
}

export const YARD_TYPES: YardTypeOption[] = [
  {
    id: "warehouse-docks",
    title: "Warehouse & Loading Docks",
    imageSrc: "/images/temp/yard-quadrant-warehouse-docks.webp",
    imageAlt: "Distribution center loading docks",
    details: {
      description: "High-frequency trailer drop-offs, appointment scheduling, and gate-to-dock door coordination.",
      keyMetrics: ["Dock Door Utilization", "Driver Detention Reduction", "Carrier Appointment Self-Service"],
      recommendedType: "Cloud Dock & Yard Scheduling System"
    }
  },
  {
    id: "rail-transit",
    title: "Rail & Intermodal Yard",
    imageSrc: "/images/temp/yard-quadrant-rail-transit.webp",
    imageAlt: "Rail yard terminal",
    details: {
      description: "Track spur allocation, locomotive switcher routing, and rail car demurrage tracking.",
      keyMetrics: ["Track Capacity Management", "Demurrage Fee Control", "Spur Occupancy Visibility"],
      recommendedType: "Rail Terminal & Track Management System"
    }
  },
  {
    id: "materials-aggregates",
    title: "Bulk & Raw Materials Yard",
    imageSrc: "/images/temp/yard-quadrant-materials-aggregates.webp",
    imageAlt: "Bulk aggregate & lumber yard",
    details: {
      description: "Unstructured outdoor staging, scale house weigh-ins, and heavy equipment movement.",
      keyMetrics: ["Scale House Throughput", "Stockpile Inventory Tracking", "Loader Asset Utilization"],
      recommendedType: "Bulk Materials & Yard GIS System"
    }
  },
  {
    id: "agriculture-processing",
    title: "Agriculture & Processing Yard",
    imageSrc: "/images/temp/yard-quadrant-agriculture-processing.webp",
    imageAlt: "Agricultural processing yard",
    details: {
      description: "Seasonal harvest influx, grain silo loading, and inspection sampling queues.",
      keyMetrics: ["Harvest Peak Queueing", "Silo Staging Capacity", "Sampling & Quality Testing Flow"],
      recommendedType: "Agri-Receiving & Processing Yard System"
    }
  }
];

export function createYardTypeEngine() {
  const [selectedYardId, setSelectedYardId] = createSignal<string | null>(null);

  const selectedYard = createMemo(() => {
    const id = selectedYardId();
    if (!id) return null;
    return YARD_TYPES.find((y) => y.id === id) || null;
  });

  return {
    selectedYardId,
    setSelectedYardId,
    selectedYard,
    allYardTypes: YARD_TYPES
  };
}
