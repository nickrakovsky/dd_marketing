import { createSignal, createMemo } from "solid-js";

/* ── Types ── */

export interface SystemMatch {
  name: string;
  score: number;
  whoIsItFor?: string;
  architecture?: string;
  capabilities?: string;
  why?: string;
}

export interface SubCategory {
  id: string;
  code: string;
  title: string;
  description: string;
  ymsFit: string;
  keyCapability: string;
  imageSrc?: string;
  imageAlt?: string;
  integrationEcosystem?: string;
  matches?: SystemMatch[];
}

export interface PrimaryYardCategory {
  id: string;
  code: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  subCategories: SubCategory[];
}

/* ── Taxonomy Data ── */

export const YARD_TAXONOMY: PrimaryYardCategory[] = [
  {
    id: "freight-cargo",
    code: "1.0",
    title: "Road Freight, Trailers or Containers",
    imageSrc: "/images/temp/yard-quadrant-warehouse-docks.webp",
    imageAlt: "Distribution center loading docks and freight buffer yards",
    subCategories: [
      {
        id: "warehouse-dc",
        code: "1.1",
        title: "Warehouse & Distribution Center Yards",
        description: "Protected dock/gate facility yards for high-velocity trailer turnaround.",
        ymsFit: "DataDocks & Cloud Dock Schedulers",
        keyCapability: "Carrier self-service portal, dock door matrix & SMS driver alerts",
        imageSrc: "/images/temp/freight-1-1-warehouse-dc.webp",
        imageAlt: "Warehouse & Distribution Center loading docks",
        integrationEcosystem: "WMS or TMS",
      },
      {
        id: "maritime-seaport",
        code: "1.2",
        title: "Maritime Seaport Container Terminals",
        description: "Quay crane, vessel stowage, and ship-to-shore container transfer yards.",
        ymsFit: "Terminal Operating Systems (TOS / Kaleris)",
        keyCapability: "RTLS container tracking, quay crane dispatch & yard gantry automation",
        imageSrc: "/images/temp/freight-1-2-maritime-seaport.webp",
        imageAlt: "Maritime Seaport Container Terminals",
        integrationEcosystem: "TOS (Terminal Operating System)",
      },
      {
        id: "rail-intermodal-cargo",
        code: "1.3",
        title: "Rail & Intermodal Cargo Hubs",
        description: "Consolidates inland rail ramps, container transfer, and railcar hump sorting.",
        ymsFit: "Rail Yard Management Systems",
        keyCapability: "Track spur occupancy mapping & railcar demurrage timers",
        imageSrc: "/images/temp/freight-1-3-rail-intermodal.webp",
        imageAlt: "Rail & Intermodal Cargo Hubs",
        integrationEcosystem: "Rail TOS or Intermodal TMS",
      },
      {
        id: "equipment-chassis-depot",
        code: "1.4",
        title: "Equipment & Chassis Storage Depots",
        description: "Dedicated empty container, chassis, and trailer drop yards.",
        ymsFit: "Depot Asset Management Platforms",
        keyCapability: "Chassis inspection gate logs & container stack inventory",
        imageSrc: "/images/temp/freight-1-4-equipment-chassis.webp",
        imageAlt: "Equipment & Chassis Storage Depots",
        integrationEcosystem: "Chassis Pool Management Software or TMS",
      },
      {
        id: "customs-bonded-holding",
        code: "1.5",
        title: "Customs, Bonded & Border Holding Yards",
        description: "Cross-border clearance, inspection buffer, and bonded storage.",
        ymsFit: "Customs-Compliant Logistics YMS",
        keyCapability: "Seal verification, customs hold flags & security gate logs",
        imageSrc: "/images/temp/freight-1-5-customs-bonded.webp",
        imageAlt: "Customs, Bonded & Border Holding Yards",
        integrationEcosystem: "Customs ERP or Bonded Warehouse WMS",
      }
    ]
  },
  {
    id: "mobile-asset-fleet",
    code: "2.0",
    title: "Finished Vehicles, Public Transit or Commercial Fleets",
    imageSrc: "/images/temp/yard-quadrant-rail-transit.webp",
    imageAlt: "Passenger transit depots, auto compounds, and commercial fleet grounds",
    subCategories: [
      {
        id: "passenger-transit",
        code: "2.1",
        title: "Passenger Transit & Municipal Services",
        imageSrc: "/images/temp/yard-sub-2-1.webp",
        description: "Bus transit depots, municipal public works yards, and civic fleet maintenance facilities.",
        ymsFit: "Transit & Municipal Depot Management Systems",
        keyCapability: "Morning pull-out lane automation, route readiness & shop-bay queuing",
        integrationEcosystem: "Transit EAM or Municipal Fleet Management System",
      },
      {
        id: "finished-vehicles-salvage",
        code: "2.2",
        title: "Finished Vehicle, Salvage & Auction Yards",
        imageSrc: "/images/temp/yard-sub-2-2.webp",
        description: "OEM factory drop-lots, auto auction compounds, salvage yards, and port vehicle terminals.",
        ymsFit: "Finished Vehicle & Compound YMS",
        keyCapability: "High-density outdoor grid storage, VIN location tracking & carrier load-building",
        integrationEcosystem: "Auction ERP or Dealer Management System (DMS)",
      },
      {
        id: "commercial-equipment",
        code: "2.3",
        title: "Commercial Equipment & Fleet Management",
        imageSrc: "/images/temp/yard-sub-2-3.webp",
        description: "Heavy equipment rental branches, commercial truck dealerships, upfitter staging, and machinery depots.",
        ymsFit: "Equipment Rental & Commercial Fleet Systems",
        keyCapability: "Work-order queues, off-rent inspection pads & ready-line availability tracking",
        integrationEcosystem: "Rental Management ERP or Fleet Maintenance Software",
      }
    ]
  },
  {
    id: "heavy-industrial-bulk",
    code: "3.0",
    title: "Industrial Stockpiles, Staging or Material Laydown",
    imageSrc: "/images/temp/yard-quadrant-materials-aggregates.webp",
    imageAlt: "Heavy manufacturing, civil laydown, and bulk material grounds",
    subCategories: [
      {
        id: "construction-civil",
        code: "3.1",
        title: "Construction & Civil Infrastructure",
        description: "Heavy civil project staging, structural steel, rebar yards, and jobsite laydown grounds.",
        ymsFit: "Laydown & Civil Material Tracking Systems",
        keyCapability: "GPS zone tagging, RFID component tracking & crane laydown dispatch",
        imageSrc: "/images/temp/yard-sub-3-1.webp",
        imageAlt: "Construction & Civil Infrastructure",
        integrationEcosystem: "Construction ERP or Site Material Management System",
      },
      {
        id: "energy-power-utility",
        code: "3.2",
        title: "Energy, Power & Utility",
        description: "Substation equipment, power generation plants, transformers, and utility laydown grounds.",
        ymsFit: "Utility & Energy Laydown Management Platforms",
        keyCapability: "High-value asset tracking, heavy haul staging & transformer bay management",
        imageSrc: "/images/temp/yard-sub-3-2.webp",
        imageAlt: "Energy, Power & Utility",
        integrationEcosystem: "Utility EAM or Grid Supply Chain ERP",
      },
      {
        id: "piping-tubular-steel",
        code: "3.3",
        title: "Piping, Tubular & Steel",
        description: "OCTG pipe yards, structural steel yards, spool fabrication, and plate storage grounds.",
        ymsFit: "Pipe Yard & Steel Storage Management Systems",
        keyCapability: "Tally management, heat number traceability & pipe rack-slotting",
        imageSrc: "/images/temp/yard-sub-3-3.webp",
        imageAlt: "Piping, Tubular & Steel",
        integrationEcosystem: "Steel Mill ERP or Pipe Yard Management System",
      },
      {
        id: "heavy-mfg-aerospace",
        code: "3.4",
        title: "Heavy Manufacturing & Aerospace",
        description: "Aerospace assembly grounds, shipbuilding yards, turbine, and oversize structural component staging.",
        ymsFit: "Industrial Plant YMS & Aerospace Staging Modules",
        keyCapability: "Oversize load routing, crane scheduling & WIP assembly staging",
        imageSrc: "/images/temp/yard-sub-3-4.webp",
        imageAlt: "Heavy Manufacturing & Aerospace",
        integrationEcosystem: "Manufacturing ERP or Aerospace Production System",
      },
      {
        id: "aggregate-mineral-quarry",
        code: "3.5",
        title: "Aggregate, Mineral & Quarry",
        description: "Quarries, sand/gravel pits, bulk mineral stockpiles, and raw material processing yards.",
        ymsFit: "Quarry & Bulk Scale-House YMS",
        keyCapability: "Weighbridge scale integration, volumetric pile mapping & haul truck dispatch",
        imageSrc: "/images/temp/yard-sub-3-5.webp",
        imageAlt: "Aggregate, Mineral & Quarry",
        integrationEcosystem: "Scale House Ticketing Software or Mining ERP",
      },
      {
        id: "bulk-packaging",
        code: "3.6",
        title: "Bulk Packaging",
        description: "FIBC super-sack storage, IBC tote yards, drum compounds, and packaged chemical staging.",
        ymsFit: "Bulk Container & Chemical Staging YMS",
        keyCapability: "Super-sack stack tracking, IBC tote inspection & hazardous staging logs",
        imageSrc: "/images/temp/yard-sub-3-6.webp",
        imageAlt: "Bulk Packaging",
        integrationEcosystem: "Chemical Batch ERP or Packaged HazMat WMS",
      }
    ]
  },
  {
    id: "biological-environmental",
    code: "4.0",
    title: "Environmental Assets, Forestry or Agricultural Land",
    imageSrc: "/images/temp/yard-quadrant-agriculture-processing.webp",
    imageAlt: "Livestock stockyards, timber grounds, and agricultural depots",
    subCategories: [
      {
        id: "forestry-timber",
        code: "4.1",
        title: "Forestry & Timber Operations",
        imageSrc: "/images/temp/yard-sub-4-1.webp",
        description: "Sawmill log decks, lumber drying yards, pulpwood concentration grounds, and silviculture seedling nurseries.",
        ymsFit: "Timber Yard Management Systems (WMS)",
        keyCapability: "Log deck tracking, timber grading, scale-house queueing & wood receipt inventory",
        integrationEcosystem: "Scale House Ticketing or Forestry Fiber ERP",
      },
      {
        id: "agricultural-livestock",
        code: "4.2",
        title: "Agricultural & Livestock Holding Yards",
        imageSrc: "/images/temp/yard-sub-4-2.webp",
        description: "Feedlot pens, stockyards, livestock auction holding pens, and processing receiving yards.",
        ymsFit: "Feedlot Yard & Stockyard Management Software",
        keyCapability: "Pen occupancy tracking, feeding schedule logs, RFID cattle tracking & trailer staging",
        integrationEcosystem: "Agribusiness ERP or Farm Management System",
      },
      {
        id: "civil-soil-remediation",
        code: "4.3",
        title: "Civil, Soil & Environmental Remediation",
        imageSrc: "/images/temp/yard-sub-4-3.webp",
        description: "Biopile fields, soil banks, remediation pads, and contaminated material treatment grounds.",
        ymsFit: "Soil Remediation & Environmental Data Systems",
        keyCapability: "Biopile cell tracking, material intake classification & volume degradation logs",
        integrationEcosystem: "Environmental Compliance ERP or Disposal Ticketing System",
      }
    ]
  }
];

/* ── Engine Hook ── */

export function createYardTypeEngine() {
  const [selectedCategoryId, setCategoryId] = createSignal<string | null>(null);
  const [selectedSubCatId, setSubCatId] = createSignal<string | null>(null);
  const [systemMatches, setSystemMatches] = createSignal<Record<string, SystemMatch[]>>({});
  const [navDirection, setNavDirection] = createSignal<"forward" | "backward">("forward");

  const selectedCategory = createMemo(() => {
    const id = selectedCategoryId();
    return id ? (YARD_TAXONOMY.find((c) => c.id === id) ?? null) : null;
  });

  const selectedSubCategory = createMemo(() => {
    const cat = selectedCategory();
    const subId = selectedSubCatId();
    const sub = cat && subId ? cat.subCategories.find((s) => s.id === subId) : null;
    return sub ? { ...sub, matches: systemMatches()[sub.id] } : null;
  });

  return {
    allCategories: YARD_TAXONOMY,
    async loadSystemMatches() {
      // Recommendations are needed only after a visitor chooses a facility.
      const { YARD_SYSTEM_MATCHES } = await import("./YardTypeMatches");
      setSystemMatches(YARD_SYSTEM_MATCHES);
    },
    selectedCategoryId,
    selectedCategory,
    selectedSubCatId,
    selectedSubCategory,
    navDirection,

    selectCategory(id: string) {
      setNavDirection("forward");
      setCategoryId(id);
    },
    selectSubCategory(id: string) {
      setNavDirection("forward");
      setSubCatId(id);
    },
    goBackToCategories() {
      setNavDirection("backward");
      setCategoryId(null);
      setSubCatId(null);
    },
    goBackToSubCategories() {
      setNavDirection("backward");
      setSubCatId(null);
    },
  };
}
