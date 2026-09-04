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
        matches: [
          {
            name: "DataDocks",
            score: 99,
            whoIsItFor: "Warehouses, manufacturing facilities, and distribution centers bottlenecked by unannounced carrier arrivals, dock door congestion, and gate wait times.",
            architecture: "Advanced Dock Scheduling & Yard Management System",
            capabilities: "Streamlines carrier delivery appointment booking, eliminates driver gate wait times, manages dock door availability for heavy parts/materials intake, and tracks unloading turnaround times."
          },
          {
            name: "YardView YMS",
            score: 88,
            whoIsItFor: "Mid-market 3PLs, manufacturing sites, and retail distribution centers seeking a dedicated, standalone SaaS yard execution tool.",
            architecture: "Dedicated SaaS Yard & Dock Management System",
            capabilities: "Trailer spotter dispatching, automated detention/demurrage tracking, gate log digitizing, and real-time dock door status dashboards."
          },
          {
            name: "C3 Yard",
            score: 85,
            whoIsItFor: "High-throughput distribution centers, retail fulfillment hubs, and 3PL warehouses managing dense trailer lots and active yard jockey fleets.",
            architecture: "Yard Management System (YMS)",
            capabilities: "Interactive 2D dynamic yard map, automated yard jockey task interleaving, gate check-in automation, and real-time trailer load/unload status tracking."
          },
          {
            name: "GoRamp",
            score: 82,
            whoIsItFor: "Warehouses, manufacturing plants, and distribution centers looking to streamline truck arrival time slots and yard traffic flow.",
            architecture: "Warehouse Dock Scheduling & Yard Operations Platform",
            capabilities: "Automated carrier self-booking, dynamic dock door calendar allocation, real-time yard asset tracking, driver check-in, and carrier performance analytics."
          },
          {
            name: "Opendock",
            score: 80,
            whoIsItFor: "Warehouse facilities and distribution hubs seeking a carrier-facing appointment portal to coordinate inbound/outbound pickups.",
            architecture: "Online Dock Appointment Scheduling & Yard Visibility Platform",
            capabilities: "Centralized carrier self-service portal, configurable time slot limits, digitized driver check-in, real-time dock status displays, and dwell-time analytics."
          },
          {
            name: "Softeon YMS",
            score: 78,
            whoIsItFor: "Distribution centers and high-velocity logistics operations seeking integrated yard execution and graphical lot mapping.",
            architecture: "Cloud Yard Management & Trailer Tracking Platform",
            capabilities: "Visual 2D yard map, automated gate check-in, spotter driver task dispatching, and dock door scheduling coordination."
          },
          {
            name: "Peripass YMS",
            score: 76,
            whoIsItFor: "High-security industrial sites, manufacturing plants, and logistics parks prioritizing strict access control and visitor verification over core operational dock execution.",
            architecture: "Automated Yard Access & Visitor Management Platform",
            capabilities: "Multi-lingual self-service driver kiosks, license plate verification, passport/ID scanning, weighbridge integration, access blacklisting, and automated barrier gate control."
          },
          {
            name: "Kaleris YMS",
            score: 74,
            whoIsItFor: "Port terminals, intermodal rail ramps, and complex distribution grounds needing deep visibility and transportation system connectivity.",
            architecture: "Intermodal & Container Yard Management System",
            capabilities: "Driver check-in kiosks, passive RFID gate/yard tracking, live inventory checks, gantry/reachstacker positioning, and intermodal freight execution."
          },
          {
            name: "Yard Management Solutions",
            score: 71,
            whoIsItFor: "Regional distribution centers and manufacturing yards seeking a straightforward, standalone trailer location and yard-jockey tracking tool.",
            architecture: "Cloud-Based Yard & Trailer Tracking Software",
            capabilities: "Visual yard inventory grid (\"Eagle Eye\"), spotter movement request queues, trailer dwell time alerts, and gate entry/exit logging."
          }
        ]
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
        matches: [
          {
            name: "Navis N4 TOS",
            score: 96,
            whoIsItFor: "High-volume container terminal operators, deep-water seaport authorities, and automated container handling yards.",
            architecture: "Terminal Operating System (TOS)",
            capabilities: "Primary benchmark for vessel stowage planning, real-time yard crane/RTG sequencing, automated gate processing, and quay-to-yard container positioning."
          },
          {
            name: "Kaleris Port Operations",
            score: 93,
            whoIsItFor: "Global port authorities and terminal operating companies managing multi-terminal port networks.",
            architecture: "Port Operations & TOS Suite",
            capabilities: "Coordinates ocean vessel load/unload operations, intermodal rail-quay transfers, automated straddle carrier dispatch, and berth schedule optimization."
          },
          {
            name: "Tideworks Mainsail",
            score: 91,
            whoIsItFor: "Marine container terminal operators, feeder ports, and bulk/breakbulk container yards.",
            architecture: "Marine Terminal Operating System & Graphical Yard Planning Engine",
            capabilities: "Provides 3D graphical yard inventory visualization, automates vessel stowage planning, manages OCR gate check-ins, and tracks container hold statuses."
          },
          {
            name: "INFORM SyncroTESS",
            score: 89,
            whoIsItFor: "Highly automated seaport terminals using automated stacker cranes (ASCs) and automated guided vehicles (AGVs).",
            architecture: "AI-Driven Terminal Optimization & Yard Decision Engine",
            capabilities: "Uses mathematical optimization to minimize container re-handling, dynamic slot allocation in high-density stacks, and real-time equipment routing."
          },
          {
            name: "DataDocks",
            score: 84,
            whoIsItFor: "RoRo/breakbulk port terminals, off-dock container freight stations (CFS), and port warehouse facilities managing high-volume, carrier-booked drayage truck appointments.",
            architecture: "Dock Scheduling and Yard Management System",
            capabilities: "Streamlines carrier delivery appointment booking, eliminates driver gate wait times, manages dock door availability for heavy parts/materials intake, and tracks unloading turnaround times."
          },
          {
            name: "CyberLogitec OPUS",
            score: 82,
            whoIsItFor: "Mega-container terminals, transshipment hubs, and semi-automated port yards.",
            architecture: "Integrated Container Terminal Operating System",
            capabilities: "End-to-end yard planning, automated vessel loading sequences, real-time container location tracking via differential GPS, and billing automation."
          },
          {
            name: "ContPark",
            score: 78,
            whoIsItFor: "Regional container terminals, inland waterway ports, and independent feeder yards.",
            architecture: "Cloud-Based SaaS Terminal Operating System",
            capabilities: "Reachstacker task automation, driver self-service mobile check-in, container yard stack management, and berth scheduling."
          },
          {
            name: "Logisoft FVL",
            score: 75,
            whoIsItFor: "Specialized seaport vehicle terminals handling finished vehicle (RoRo) imports and exports.",
            architecture: "Automotive Finished Vehicle Port Terminal Management System",
            capabilities: "Tracks vehicle VIN-level positions on port staging aprons, manages vessel roll-on/roll-off loading logs, coordinates pre-delivery inspections (PDI), and manages car-hauler gate passes."
          }
        ]
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
        matches: [
          {
            name: "INFORM SyncroTESS",
            score: 95,
            whoIsItFor: "Class 1 rail ramps, high-density intermodal terminals, and inland rail container yards.",
            architecture: "AI-Powered Intermodal Terminal & Yard Optimization System",
            capabilities: "Dynamic track assignment, automated reachstacker/gantry crane dispatch, minimization of well-car re-spotting, and real-time train assembly optimization."
          },
          {
            name: "Tideworks Intermodal Pro",
            score: 92,
            whoIsItFor: "Intermodal rail ramp operators and inland container transload facilities.",
            architecture: "Purpose-Built Intermodal Terminal Operating System",
            capabilities: "Tracks container-to-railcar placement, automates OCR gate check-ins, manages chassis-to-container pairing, and coordinates hostler truck moves."
          },
          {
            name: "DataDocks",
            score: 88,
            whoIsItFor: "Intermodal cross-dock hubs, transload warehouses, and rail-to-truck distribution centers managing tight drayage truck arrival schedules.",
            architecture: "Dock Scheduling and Yard Management System",
            capabilities: "Streamlines carrier delivery appointment booking, eliminates driver gate wait times, manages dock door availability for heavy parts/materials intake, and tracks unloading turnaround times."
          },
          {
            name: "Blume Global",
            score: 86,
            whoIsItFor: "Intermodal logistics providers, Class 1 rail networks, and inland port hubs.",
            architecture: "Intermodal Supply Chain & Terminal Execution Platform",
            capabilities: "Real-time visibility into intermodal ramp inventory, automated chassis assignment, gate inspection logging, and railcar load/unload tracking."
          },
          {
            name: "Kaleris Rail TOS",
            score: 85,
            whoIsItFor: "Industrial rail yards, short-line railroads, and intermodal transload hubs.",
            architecture: "Rail Yard & Intermodal Operating System",
            capabilities: "Railcar switching optimization, track layout mapping, intermodal container stack management, and train load-building verification."
          },
          {
            name: "Optym Rail Optimizer",
            score: 81,
            whoIsItFor: "Rail network dispatchers, classification yards, and heavy intermodal rail terminals.",
            architecture: "Algorithmic Rail Yard Decision Support & Optimization System",
            capabilities: "Automates railcar switching schedules, optimizes track utilization, predicts yard bottlenecks, and re-sequences inbound/outbound train arrivals."
          },
          {
            name: "1Traq",
            score: 79,
            whoIsItFor: "Heavy industrial rail-to-truck transload yards (frac sand, bulk cement, steel, agricultural commodities).",
            architecture: "Multimodal Heavy Industrial Yard & Rail Management System",
            capabilities: "Tracks railcar track placement, manages bulk material transloading to trucks, driver self-service kiosk check-in, and tracks heavy equipment movements."
          },
          {
            name: "ProAct CMS",
            score: 74,
            whoIsItFor: "Multi-modal finished goods distributors, automotive railhead transload yards, and cross-docking rail compounds.",
            architecture: "Multi-Modal Compound Management System (CMS)",
            capabilities: "Tracks asset handoffs from railcar to staging yard, railcar loading/unloading sequences, compound inventory tracking, and carrier dispatch management."
          }
        ]
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
        matches: [
          {
            name: "ContVisor",
            score: 94,
            whoIsItFor: "Dedicated intermodal container and chassis depots, off-dock equipment yards, and M&R facilities.",
            architecture: "Container Depot & Equipment Management System",
            capabilities: "Bare chassis stack management, container/chassis matching, EDI gate-in/gate-out reporting, gate damage inspection recording, and equipment storage billing."
          },
          {
            name: "CargoWise Landside",
            score: 92,
            whoIsItFor: "Off-dock container depots, chassis storage lots, and empty container storage yards managing gate movements, reefer pre-trip inspections (PTI), and repair staging.",
            architecture: "Container Depot & Terminal Management Platform",
            capabilities: "Automated container stack tracking, gate OCR capture, reefer temperature and PTI inspection workflows, chassis pairing, and automated depot storage billing."
          },
          {
            name: "Cetaris Fleet",
            score: 89,
            whoIsItFor: "Heavy equipment fleets, chassis leasing operators, and trailer depot maintenance facilities.",
            architecture: "Equipment Maintenance & Depot Asset Software",
            capabilities: "Tracks equipment Maintenance & Repair (M&R) queues, manages repair shop bay allocations, monitors chassis safety compliance, and tracks ready-line availability."
          },
          {
            name: "MCS Rental Software",
            score: 87,
            whoIsItFor: "Mobile equipment hire depots, plant rental operators, and construction chassis yards.",
            architecture: "Equipment Hire & Depot Asset ERP",
            capabilities: "Tracks equipment operational state (ready-for-hire, undergoing inspection, down for repair), manages return inspection staging zones, and automates transport fleet dispatch."
          },
          {
            name: "Point of Rental",
            score: 85,
            whoIsItFor: "Regional equipment depots, heavy tool yards, and mobile plant rental branches.",
            architecture: "Equipment Depot Operations & Staging Software",
            capabilities: "Coordinates outdoor equipment lot staging, tracks equipment return queues, automates wash bay work orders, and manages equipment availability."
          },
          {
            name: "DataDocks",
            score: 82,
            whoIsItFor: "Equipment repair depots, chassis maintenance hubs, and parts distribution yards managing scheduled truck turnarounds for equipment intake and shop-bay drops.",
            architecture: "Dock Scheduling and Yard Management System",
            capabilities: "Streamlines carrier delivery appointment booking, eliminates driver gate wait times, manages dock door availability for heavy parts/materials intake, and tracks unloading turnaround times."
          },
          {
            name: "Wynne Systems RentalMan",
            score: 80,
            whoIsItFor: "Heavy machinery fleets, chassis leasing enterprises, and multi-branch equipment depots.",
            architecture: "Equipment Fleet & Yard Management ERP",
            capabilities: "Multi-branch equipment inventory visibility, return-pad inspection workflows, maintenance staging queues, and total cost of ownership tracking."
          },
          {
            name: "Texada SRM",
            score: 78,
            whoIsItFor: "Heavy machinery dealerships, vocational chassis yards, and mobile equipment service centers.",
            architecture: "Heavy Equipment Rental & Service Yard System",
            capabilities: "Off-rent equipment return staging, inspection workflows, service shop dispatching, and equipment lifecycle tracking."
          },
          {
            name: "AssetWorks FleetFocus",
            score: 74,
            whoIsItFor: "Public works equipment depots, municipal utility fleets, and transit chassis yards.",
            architecture: "Fleet Asset Management & Maintenance Yard System",
            capabilities: "Tracks outdoor equipment staging positions, preventive maintenance queue scheduling, parts inventory consumption, and shop-bay dispatch."
          }
        ]
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
        matches: [
          {
            name: "MIC Customs Solutions",
            score: 95,
            whoIsItFor: "Multinational manufacturers, customs-bonded warehouse operators, and Foreign Trade Zone (FTZ) yard facilities.",
            architecture: "Global Trade Compliance & Bonded Yard System",
            capabilities: "Automates customs-bonded inventory tracking, manages FTZ admission forms (e.g., e-214), maintains complete audit trails from entry to disposition, and manages duty-deferral reconciliation."
          },
          {
            name: "Descartes FTZ & Yard",
            score: 92,
            whoIsItFor: "Customs brokers, 3PL bonded logistics providers, and cross-border FTZ operators.",
            architecture: "Foreign Trade Zone & Customs Bonded Inventory Management Platform",
            capabilities: "Direct electronic filing to regulatory customs agencies (e.g., ACE), automated duty/tariff calculation, bonded storage inventory tracking, and customs hold/release status management."
          },
          {
            name: "DataDocks",
            score: 80,
            whoIsItFor: "Customs-bonded warehouses, FTZ staging facilities, and border holding yards needing to schedule and throttle carrier dock appointments around customs inspection holds.",
            architecture: "Dock Scheduling & Yard Management System",
            capabilities: "Streamlines carrier delivery appointment booking, eliminates driver gate wait times, manages dock door availability for heavy parts/materials intake, and tracks unloading turnaround times."
          },
          {
            name: "CargoWise Landside",
            score: 78,
            whoIsItFor: "Global freight forwarders, international logistics hubs, and bonded terminal operators.",
            architecture: "Global Logistics Execution & Bonded Terminal Platform",
            capabilities: "Integrates inward/outward processing customs regimes with yard operations, automates import/export border clearances, and tracks customs hold statuses in real time."
          },
          {
            name: "ONESOURCE FTZ",
            score: 75,
            whoIsItFor: "Importers and exporters operating high-volume FTZ holding yards and duty-free manufacturing zones.",
            architecture: "Global Trade Management (GTM) & FTZ Operational Platform",
            capabilities: "Manages FTZ inventory compliance, automates weekly entry filings, tracks duty-deferred stock levels across staging areas, and minimizes customs duty liability."
          },
          {
            name: "E2open",
            score: 73,
            whoIsItFor: "Cross-border shippers, multi-modal transport operators, and bonded logistics parks.",
            architecture: "Multi-Party Global Trade Compliance & Logistics Execution Network",
            capabilities: "Real-time customs clearance tracking across global trade corridors, electronic seal/chain-of-custody verification, and bonded warehouse/yard inventory auditing."
          },
          {
            name: "Magaya Customs Suite",
            score: 70,
            whoIsItFor: "Freight forwarders, bonded warehouse operators, and border logistics hubs.",
            architecture: "Customs Bonded Inventory & Logistics Execution Software",
            capabilities: "Generates bonded yard receipts, automates Automated Commercial Environment (ACE) filings, tracks customs-controlled inventory positions, and manages duty-unpaid releases."
          },
          {
            name: "Customs City",
            score: 67,
            whoIsItFor: "Mid-market bonded warehouses, border holding grounds, and customs-controlled storage yards.",
            architecture: "Cloud-Based Customs Compliance & Duty-Deferred Inventory Platform",
            capabilities: "Real-time tracking of duty-deferred inventory, automated bond release workflows, border gate check-in logging, and regulatory compliance reporting."
          }
        ]
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
        matches: [
          {
            name: "Clever Devices SmartYard",
            score: 88,
            whoIsItFor: "Public transit authorities and municipal bus operators managing high-density bus aprons and depot staging.",
            architecture: "Transit Bus Depot Management System (DMS)",
            capabilities: "Uses real-time location tracking to manage bus parking positions, automates morning departure sequencing ('pull-out'), prevents blocked departure lanes, and coordinates wash/fueling queues.",
            why: "Market leader for bus transit depot management and pull-out lane automation."
          },
          {
            name: "Trapeze Yard Manager",
            score: 84,
            whoIsItFor: "Municipal public transit agencies, regional commuter rail operators, and large bus fleets managing complex transit depot infrastructure and rolling stock maintenance.",
            architecture: "Transit Enterprise Asset Management & Depot Staging System",
            capabilities: "Manages outdoor transit vehicle parking allocation, integrates shop-bay maintenance scheduling with yard positioning, coordinates fleet cleaning and fueling workflows, and ensures timetable-compliant morning pull-outs.",
            why: "Transit platform managing vehicle staging and shop-bay queuing."
          },
          {
            name: "AssetWorks FleetFocus",
            score: 80,
            whoIsItFor: "Municipal public works departments, civic utility fleets, and public sector transit operators managing multi-asset maintenance and storage yards.",
            architecture: "Fleet Asset Management & Maintenance Yard System",
            capabilities: "Coordinates outdoor maintenance queues, shop-bay allocation, municipal vehicle readiness tracking, parts inventory consumption, and preventative maintenance staging.",
            why: "Dominant across municipal public works and civic multi-asset depots."
          },
          {
            name: "PSI Transcom DMS",
            score: 72,
            whoIsItFor: "Public transit authorities, municipal bus operators, and electric bus (eBus) fleet depots managing automated yard positioning and EV charging.",
            architecture: "Transit Depot Management & EV Charging Optimization System",
            capabilities: "Automates parking position assignments on the transit apron, coordinates wash/service routing, optimizes EV charging sequences to minimize peak energy costs, and sequences morning pull-out departures.",
            why: "Rail, bus, and EV transit depot management."
          },
          {
            name: "INIT MOBILE-DMS",
            score: 68,
            whoIsItFor: "Municipal public transit authorities and large urban bus networks requiring integrated yard positioning, driver handoffs, and service depot workflows.",
            architecture: "Transit Vehicle Depot Management & Operations Platform",
            capabilities: "Tracks real-time vehicle positions on the depot apron, guides drivers directly to their assigned bus via mobile terminals, automates wash and fueling queue routing, and integrates seamlessly with fleet telematics and farebox clearing.",
            why: "Automated vehicle positioning and driver handoff tools."
          },
          {
            name: "Zonar Yard",
            score: 62,
            whoIsItFor: "School bus contractors, private charter operators, municipal utility fleets, and commercial truck dispatch yards managing outdoor fleet tracking and safety compliance.",
            architecture: "Telematics-Integrated Fleet Yard & Asset Location Platform",
            capabilities: "Tracks real-time outdoor GPS coordinates of vehicles across parking lots, streamlines electronic verified inspection reporting (EVIR) for pre-trip safety checks, manages ready-line staging, and alerts managers to unauthorized vehicle movement.",
            why: "School bus and utility fleet outdoor location tracking."
          },
          {
            name: "Goal Systems",
            score: 50,
            whoIsItFor: "City transit operators, regional bus companies, and private charter coach operators managing complex driver shift transitions, departure scheduling, and parking lane assignments.",
            architecture: "Transit Scheduling & Depot Departure Optimization Software",
            capabilities: "Optimizes physical parking lane allocation based on departure sequence, aligns vehicle availability with driver shift rosters, and automates real-time pull-out re-sequencing during fleet disruptions.",
            why: "Departure scheduling and driver roster optimization."
          },
          {
            name: "DataDocks",
            score: 18,
            whoIsItFor: "Municipal transit authorities, civic public works depots, and bus fleet operators that manage receiving docks for commercial delivery trucks bringing bulk spare parts, tires, lubricants, and maintenance supplies alongside core transit bus staging.",
            architecture: "Dock Scheduling and Yard Management System",
            capabilities: "Carrier self-service booking, dock door matrix management, automated driver check-in, and dock queue visibility for inbound freight.",
            why: "Central municipal depots and large transit hubs operate receiving docks for high-volume freight—such as bulk tires, spare engine parts, lubricants, and facility supplies. In a two-system architecture, DataDocks manages carrier appointment scheduling and loading dock queues for inbound parts, while Clever Devices or AssetWorks handles active bus dispatch."
          }
        ]
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
        matches: [
          {
            name: "INFORM SyncroTESS",
            score: 86,
            whoIsItFor: "OEM factory drop-lots, port auto terminals, railhead transload compounds, and large finished vehicle logistics (FVL) distribution yards.",
            architecture: "AI-Driven Finished Vehicle Compound Management System (CMS)",
            capabilities: "Automates dynamic grid-slotting using AI algorithms, optimizes car-hauler and railcar load building, tracks VIN-level indoor/outdoor movements, and minimizes driver travel times across massive automotive compounds.",
            why: "Standard for OEM compounds, factory drop-lots, and port terminals."
          },
          {
            name: "AutoIMS",
            score: 82,
            whoIsItFor: "Commercial vehicle consignors (banks, fleet leasing companies, OEMs) and wholesale auto auction grounds managing high-volume vehicle remarketing inventory.",
            architecture: "Commercial Vehicle Remarketing & Inventory Management Platform",
            capabilities: "Connects commercial vehicle owners with auction yards to track real-time vehicle location, physical lot status, title clearance holds, reconditioning workflows, and sale readiness.",
            why: "Central inventory platform connecting commercial consignors and auto auctions."
          },
          {
            name: "Copart",
            score: 78,
            whoIsItFor: "Insurance salvage processors, vehicle impound facilities, and auto scrap yards holding damaged, repossessed, or total-loss vehicles.",
            architecture: "Salvage, Auction & Impound Yard Management System",
            capabilities: "Manages tow-truck/loader intake, grid location tracking for non-runners, title/lien hold tracking, condition scoring, and buyer pickup gate-pass authorization.",
            why: "Leading platform for salvage, impound, and damaged vehicle lots."
          },
          {
            name: "ProAct FVL YMS",
            score: 74,
            whoIsItFor: "Finished vehicle logistics (FVL) providers, port auto terminal operators, and OEM plant distribution yards managing vehicle supply chain transport and tracking.",
            architecture: "Finished Vehicle Compound Management System (CMS)",
            capabilities: "Tracks VIN-level movements across multi-modal transport hubs (sea, rail, car hauler), manages pre-delivery inspection (PDI) staging, coordinates load-building for auto carriers, and monitors compound storage holds.",
            why: "Purpose-built finished vehicle logistics across ports and railheads."
          },
          {
            name: "Auction Edge",
            score: 65,
            whoIsItFor: "Independent wholesale auto auctions and regional vehicle remarketing yards handling multi-lane vehicle sales and physical staging.",
            architecture: "Independent Auto Auction Management System (AMS)",
            capabilities: "Manages outdoor vehicle arrival check-in, grid-coordinate assignment, condition report queuing, reconditioning status tracking, and physical auction-lane staging.",
            why: "Backbone software for independent wholesale auto auctions."
          },
          {
            name: "RMS Automotive",
            score: 58,
            whoIsItFor: "OEM leasing divisions, commercial fleet managers, and financial institutions managing high-volume off-lease vehicle returns, reconditioning, and auction dispatch.",
            architecture: "Portfolio Remarketing & Off-Lease Vehicle Holding Yard Management Platform",
            capabilities: "Tracks off-lease vehicle inventory from turn-in through reconditioning, manages holding yard assignments, coordinates condition report generation, and automates vehicle listing across wholesale auction networks.",
            why: "Lease-return and fleet off-boarding yard management."
          },
          {
            name: "Logisoft FVL",
            score: 52,
            whoIsItFor: "Port auto terminal operators, OEM vehicle distribution yards, and railhead transload hubs managing high-volume finished vehicle handling.",
            architecture: "Finished Vehicle Logistics (FVL) Yard & Port Terminal Management System",
            capabilities: "Manages vessel/rail loading and unloading staging, coordinates pre-delivery inspection (PDI) pad workflows, tracks VIN-level outdoor grid locations, and automates car-hauler gate processing.",
            why: "Port auto terminal staging and PDI pad management."
          },
          {
            name: "Virtual Yard DMS",
            score: 48,
            whoIsItFor: "Automotive dealerships, commercial truck lots, RV yards, and vehicle holding compounds managing outdoor unit placement and sales inventory.",
            architecture: "Dealership Management & Yard Inventory System",
            capabilities: "Tracks vehicle inventory locations across dealer lots, manages vehicle intake inspections, coordinates stock movement, and handles online inventory publishing.",
            why: "Purpose-built for automotive dealership lots and holding compounds."
          },
          {
            name: "DataDocks",
            score: 12,
            whoIsItFor: "Auto auction centers, PDI processing hubs, and mega-salvage yards that operate separate loading bays to receive enclosed freight shipments of spare parts, reconditioning supplies, and fluids alongside outdoor vehicle grid storage.",
            architecture: "Dock Scheduling and Yard Management System",
            capabilities: "Supplier delivery appointment scheduling, dock door slotting, carrier SMS notifications, and dock turnaround analytics.",
            why: "Auto auction centers, PDI processing hubs, and mega-salvage yards manage separate loading bays for incoming reconditioning supplies, spare parts, or enclosed freight shipments. Under a dual-system setup, DataDocks coordinates truck appointment windows at the receiving bay, while INFORM or AutoIMS tracks physical vehicle inventory across the outdoor grid fields."
          }
        ]
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
        matches: [
          {
            name: "Chevin FleetWave",
            score: 90,
            whoIsItFor: "Commercial fleet operators, vocational transport yards, and heavy equipment maintenance depots tracking vehicle readiness, yard parking, and shop-bay queues.",
            architecture: "Fleet Depot Management & Maintenance Platform",
            capabilities: "Tracks vehicle parking locations across depot yards, manages workshop maintenance queues, records pre-trip safety checks, and coordinates ready-line fleet availability.",
            why: "Fleet depot and maintenance queue management platform."
          },
          {
            name: "Wynne Systems RentalMan",
            score: 88,
            whoIsItFor: "Heavy equipment rental corporations, multi-branch construction machinery dealers, and large mobile plant fleets managing high-value equipment yards.",
            architecture: "Equipment Rental ERP & Fleet Yard Management Platform",
            capabilities: "Tracks equipment availability across multi-branch rental yards, manages return-pad inspection and wash/repair staging, optimizes delivery truck transport dispatch, and tracks total cost of ownership for heavy machinery.",
            why: "ERP and yard standard for heavy equipment rental branches."
          },
          {
            name: "Point of Rental",
            score: 84,
            whoIsItFor: "Construction equipment rental branches, heavy machinery dealerships, and event fleet depots managing equipment staging, maintenance, and field dispatch.",
            architecture: "Equipment Rental Management & Fleet Staging Software",
            capabilities: "Manages outdoor equipment yard staging zones, tracks off-rent return inspection queues, coordinates wash bay and maintenance work orders, and optimizes rental fleet availability for transport delivery.",
            why: "Widely used across equipment rental branches and machinery depots."
          },
          {
            name: "Procede Excede",
            score: 76,
            whoIsItFor: "Class 4–8 commercial truck dealerships, heavy vehicle service centers, and vocational chassis upfitters managing outdoor service queues and truck inventory.",
            architecture: "Heavy-Duty Commercial Vehicle Dealer Management System (DMS)",
            capabilities: "Manages outdoor chassis staging yards, tracks service queue placement and shop-bay dispatch, handles heavy truck parts inventory, and coordinates ready-for-delivery customer handoffs.",
            why: "DMS for commercial truck dealerships and chassis upfitters."
          },
          {
            name: "Texada SRM",
            score: 70,
            whoIsItFor: "Construction equipment dealerships, heavy equipment rental yards, and mobile machinery service depots managing equipment fleet lifecycles.",
            architecture: "Heavy Equipment Rental & Service Yard Management System",
            capabilities: "Coordinates off-rent return inspection pads, tracks machinery yard status (ready-for-rent, wash bay, down for repair), manages field service dispatch, and tracks heavy equipment work-order progression.",
            why: "Heavy machinery staging and service queue management."
          },
          {
            name: "Karmak Fusion",
            score: 66,
            whoIsItFor: "Class 4–8 commercial truck dealerships, heavy-duty repair shops, and vocational body-builder upfitting yards.",
            architecture: "Heavy-Duty Commercial Truck Dealer Management System (DMS)",
            capabilities: "Manages outdoor chassis staging yards, coordinates service shop bay queuing and work-order progression, tracks vocational upfitter build stages, and maintains commercial truck inventory status.",
            why: "Commercial truck dealership service yards and upfitter staging."
          },
          {
            name: "Fleetio",
            score: 60,
            whoIsItFor: "Field service contractors, utility fleets, and commercial service depots managing work van/truck maintenance staging and readiness.",
            architecture: "Fleet Maintenance & Service Staging Management Platform",
            capabilities: "Tracks vehicle-off-road (VOR) status, coordinates outdoor service queue locations, manages preventative maintenance scheduling, and monitors fleet ready-line availability.",
            why: "Commercial fleet maintenance queues and field service fleet availability."
          },
          {
            name: "MCS Rental Software",
            score: 52,
            whoIsItFor: "Equipment hire companies, tool hire depots, and plant rental yards managing mobile machinery, delivery fleets, and repair staging.",
            architecture: "Equipment Hire & Rental Yard ERP / Asset Management System",
            capabilities: "Tracks physical machinery location (ready-for-rent, return-inspection, or maintenance-required), manages rental contract dispatch/returns, tracks mobile plant maintenance histories, and coordinates transport fleet staging.",
            why: "Equipment hire and mobile plant yard tracking."
          },
          {
            name: "DataDocks",
            score: 28,
            whoIsItFor: "Heavy machinery branches, truck dealerships, and large fleet maintenance centers that operate high-volume parts receiving docks to unload heavy components (hydraulics, engine blocks, tracks, fluids) delivered by freight carriers.",
            architecture: "Dock Scheduling and Yard Management System",
            capabilities: "Dock-door appointment booking, vendor delivery scheduling, yard trailer location tracking, and inbound driver self-check-in.",
            why: "Heavy machinery branches, truck dealerships, and large fleet maintenance centers operate high-volume parts receiving docks to unload heavy components (hydraulics, engine blocks, tracks, fluids) delivered by freight carriers. A dual-system architecture pairs DataDocks for dock-door appointment booking and vendor delivery scheduling with Wynne or Procede for managing equipment, work orders, and ready-lines."
          }
        ]
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
        matches: [
          {
            name: "Hexagon Jovix",
            score: 89,
            whoIsItFor: "EPC contractors, project owners, and fabricators on industrial capital projects (Oil & Gas, Power, Mining) and civil infrastructure.",
            architecture: "Material Readiness Platform",
            capabilities: "Auto-ID deployment (Active/Passive RFID, GPS, BLE, Barcode) for real-time localization of engineered items in vast laydown yards; dynamic 2D/3D yard mapping; and automated material receipts."
          },
          {
            name: "Track'em",
            score: 86,
            whoIsItFor: "General contractors and specialized subcontractors managing fabricated parts, structural steel, and equipment across temporary laydown zones in civil, mining, and energy sectors.",
            architecture: "Spatial Material Tracking & Item-Level Inventory System",
            capabilities: "Visual 2D/3D yard mapping using GPS coordinates; mobile barcode scanning for real-time check-in/move; item history from fabrication to installation; and configurable geofencing for automated yard presence alerts."
          },
          {
            name: "CyberStockroom",
            score: 84,
            whoIsItFor: "Subcontractors, suppliers, and regional laydown yards requiring a drag-and-drop visual interface to locate materials.",
            architecture: "Map-Driven Visual Inventory Software",
            capabilities: "Interactive 2D 'map' view of the entire yard layout; intuitive drag-and-drop item movement between zones (racks, bins, containers); mobile check-in/check-out scanning; and visual color-coding of inventory quantities."
          },
          {
            name: "DataDocks",
            score: 82,
            whoIsItFor: "Construction supply depots, manufacturing complexes, and infrastructure support sites that operate an on-site warehouse receiving parts and supplies in semi-trailers that require unloading with forklifts or by hand.",
            architecture: "Dock Scheduling & Yard Management System",
            capabilities: "Throttles incoming carrier arrivals via an online booking portal; eliminates gate and access road congestion; streamlines driver check-ins and dock door assignments; and tracks unloading turnaround times to minimize driver detention fees."
          },
          {
            name: "Tenna",
            score: 80,
            whoIsItFor: "Mixed-fleet heavy civil, highway, and utility contractors who manage rolling heavy equipment, specialized attachments, and tools moving between central yards and active jobsites.",
            architecture: "Construction Equipment Management & IoT Telematics Platform",
            capabilities: "Live yard visibility via ruggedized GPS trackers and BLE beacons; utilization monitoring (detecting yard idleness vs. field activity); integrated preventive maintenance scheduling for yard assets; and digital circle-check inspection workflows."
          },
          {
            name: "ToolWatch",
            score: 79,
            whoIsItFor: "Commercial general contractors, specialized trades, and civil firms operating central warehouses and field tool cribs requiring accountability for equipment, tools, and consumables.",
            architecture: "Field Resource Management & Tool Crib Software",
            capabilities: "Strict chain-of-custody tracking (check-out/check-in); digital tool crib visualization; automated internal job costing and asset usage billing; inventory counts for consumables; and maintenance/calibration alert workflows."
          },
          {
            name: "Veyor Digital",
            score: 76,
            whoIsItFor: "Main contractors and project managers on urban infrastructure projects, constrained jobsites, or ports where laydown yard space requires strict delivery flow.",
            architecture: "Site Logistics, Delivery Scheduling & Access Control Platform",
            capabilities: "Supplier self-service booking portal for delivery windows; gate access control and guard-shack dashboards; specific laydown zone or drop spot assignment; and digital paperless ticketing/receipt validation."
          },
          {
            name: "HCSS Equipment360",
            score: 71,
            whoIsItFor: "Heavy civil, earthmoving, asphalt, and highway contractors whose yard operations support fleet maintenance and field production.",
            architecture: "Heavy Civil Operations & Equipment Fleet ERP",
            capabilities: "Laydown yard parts inventory linked directly to mechanic work orders; fuel inventory tracking; field telemetry integration with HeavyJob; and precise tracking of critical maintenance consumables."
          }
        ]
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
        matches: [
          {
            name: "Enverus OpenMaterials",
            score: 88,
            whoIsItFor: "Energy producers, utility infrastructure contractors, and remote site operators managing distributed equipment yards, pipe yards, and field staging grounds.",
            architecture: "Energy Staging & Material Tracking System",
            capabilities: "Mobile QR/barcode scanning for serialized assets, piping, valves, and heavy components; automated material transfer logging across multi-yard networks; digital goods receiving; and field-to-office inventory reconciliation."
          },
          {
            name: "Track'em",
            score: 86,
            whoIsItFor: "Electric, gas, and water utility providers, solar farm sites, and power generation contractors managing high-value transformers, switchgear, and utility laydown pads.",
            architecture: "Spatial Material Tracking & Laydown Inventory Platform",
            capabilities: "GPS coordinate mapping of substation components, barcode/RFID scanning for transformers and high-voltage gear, real-time yard heat maps, and field work-order issuance."
          },
          {
            name: "SAP Yard Logistics",
            score: 83,
            whoIsItFor: "Large-scale energy enterprises and multi-utility corporations requiring direct integration between corporate procurement and physical staging yards.",
            architecture: "Supply Chain ERP & Yard Logistics Engine",
            capabilities: "Synchronizes high-value component tracking in staging yards with financial accounting; manages bulk asset movements; automates procurement-to-yard receipts; and provides enterprise-wide inventory visibility."
          },
          {
            name: "DataDocks",
            score: 81,
            whoIsItFor: "Sites that operate an on-site warehouse receiving supplies, replacement parts, and maintenance hardware in semi-trailers that require unloading with forklifts or by hand.",
            architecture: "Dock Scheduling & Yard Management System",
            capabilities: "Throttles incoming carrier arrivals via an online booking portal; eliminates gate and access road congestion; streamlines driver check-ins and dock door assignments; and tracks unloading turnaround times to minimize driver detention fees."
          },
          {
            name: "FourKites Dynamic Yard",
            score: 78,
            whoIsItFor: "Energy facilities, refineries, and power generation sites managing heavy inbound truck, tanker, or railcar traffic through facility gates.",
            architecture: "Inbound Logistics & Yard Management System (YMS)",
            capabilities: "Gate-in/gate-out access control and driver self-check-in; real-time spotter truck dispatching; trailer and tanker dwell-time tracking; and automated appointment scheduling for inbound deliveries."
          },
          {
            name: "ABB Ability",
            score: 74,
            whoIsItFor: "Thermal, biomass, and heavy power generation plants managing continuous bulk material and fuel stockyards.",
            architecture: "Bulk Fuel & Material Stockyard Management System",
            capabilities: "Tracks coal, biomass, or mineral inventory volumes and material density; directs automated stackers, reclaimers, and conveyor routing; and monitors fuel quality metrics prior to plant combustion."
          },
          {
            name: "Siemens SIMATIC",
            score: 70,
            whoIsItFor: "Industrial energy sites and heavy power utility plants requiring automated physical equipment control in raw material receiving yards.",
            architecture: "Distributed Control System & Automation Layer",
            capabilities: "Direct PLC/SCADA control of physical yard hardware (wagon tipplers, conveyor belts, stacker-reclaimers); real-time material flow telemetry; and central control room operational integration."
          },
          {
            name: "ETAP Real-Time",
            score: 66,
            whoIsItFor: "Power plant electrical engineers, switchyard superintendents, and grid operators focused on high-voltage electrical infrastructure rather than general material yard logistics.",
            architecture: "Electrical Switchyard & Power System Operational Software",
            capabilities: "Physics-based digital twin modeling of high-voltage switchyards and substations; real-time electrical load monitoring; arc-flash/short-circuit safety analysis; and automated load-shedding execution."
          }
        ]
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
        matches: [
          {
            name: "Hexagon Smart Yard",
            score: 78,
            whoIsItFor: "Commercial shipyards, offshore module fabrication yards, heavy structural steel fabricators, and EPC supply chains managing outdoor fabrication grounds.",
            architecture: "Material Lifecycle & Fabrication Yard Management System",
            capabilities: "Manages material lifecycles from engineering Bill of Materials (BOM) through fabrication shop work packs; advanced yard grid and rack positioning for raw steel plates, structural shapes, and piping spools; and dynamic staging based on project schedules."
          },
          {
            name: "Track'em",
            score: 75,
            whoIsItFor: "Industrial contractors, mining firms, and civil construction teams managing loose structural steel, piping, and equipment across temporary field laydown yards.",
            architecture: "Spatial Resource & Laydown Yard Tracking System",
            capabilities: "Map-based visual material tracking using barcode, QR code, GPS, and Bluetooth tags; tracks free-issue or procured steel and piping from vendor delivery to site erection; and integrates 3D BIM models with outdoor laydown locations."
          },
          {
            name: "STRUMIS",
            score: 73,
            whoIsItFor: "Structural steel fabricators, steel processors, and metal distribution centers requiring dedicated outdoor yard location tracking and steel tracking from receiving to dispatch.",
            architecture: "Structural Steel Management & Yard Logistics System",
            capabilities: "Mobile barcode/RFID tracking of structural steel sections, plates, and assemblies across outdoor laydown grid zones; real-time yard status updates; material heat number and Mill Test Report (MTR) tracking; and automated load-building and dispatch management for outbound trailers."
          },
          {
            name: "SPOOLMAN-ERMAN",
            score: 71,
            whoIsItFor: "Pipe spool fabrication shops, coating and painting yards, and industrial site staging stockpiles.",
            architecture: "Pipe Spool Fabrication & Staging Control System",
            capabilities: "Tracks spools and pipe joints across fit-up, welding, NDT, blasting, painting, and yard storage; utilizes ruggedized UHF RFID tags and 2D barcodes built for harsh outdoor environments; and manages 'matching front' analysis to confirm all fittings and pipe lengths are present before releasing items to the field."
          },
          {
            name: "DataDocks",
            score: 69,
            whoIsItFor: "Operations that have an on-site warehouse receiving supplies, fittings, and maintenance hardware in semi-trailers that require unloading with forklifts or by hand.",
            architecture: "Dock Scheduling & Yard Management System",
            capabilities: "Throttles incoming carrier arrivals via an online booking portal; eliminates gate and access road congestion; streamlines driver check-ins and dock door assignments; and tracks unloading turnaround times to minimize driver detention fees."
          },
          {
            name: "Tubular Data Systems",
            score: 67,
            whoIsItFor: "OCTG (Oil Country Tubular Goods) pipe yards, threaders, storage facilities, and pipe inspection companies handling specialized downhole tubulars.",
            architecture: "OCTG Inventory, Inspection & Pipe Yard Management System",
            capabilities: "Purpose-built tracking for casing, tubing, drill pipe, and line pipe joints; rack, row, and bin-level location assignments; automated pipe tallies; heat number and grade specification logging; and integrated work orders for cleaning, inspection, threading, and storage fees."
          },
          {
            name: "Insite LMS",
            score: 65,
            whoIsItFor: "Field logistics teams, industrial construction sites, and turnaround crews handling outdoor material logistics in remote or connectivity-challenged environments.",
            architecture: "Site Logistics & Outdoor Material Handling Platform",
            capabilities: "App-driven site receiving, unloading, outdoor storage mapping, and field issuing; GPS location tagging for individual structural steel pieces or pipe components; and offline mobile execution for rugged yards lacking Wi-Fi or cellular coverage."
          },
          {
            name: "AVEVA ERM",
            score: 62,
            whoIsItFor: "Energy, process, and marine EPCs requiring tight integration between 3D design models, procurement, and fabrication yard inventory.",
            architecture: "Capital Project Material Control & ERM Module",
            capabilities: "Manages piping specs, material take-offs (MTO), and yard delivery workflows; high-traceability allocation tracking heat numbers, Material Test Reports (MTRs), and NDT status; and directly links outdoor inventory levels to 3D design models."
          }
        ]
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
        matches: [
          {
            name: "DELMIA",
            score: 78,
            whoIsItFor: "Commercial and defense aerospace manufacturers, major shipyards, and complex discrete builders managing high-value final assembly lines (FAL) and spatial hangar/yard footprints.",
            architecture: "Digital Manufacturing & Virtual Twin Operations Suite",
            capabilities: "3D spatial simulation of yard, dock, and hangar footprints; crane sweep and trajectory optimization; heavy fixture staging; and physical positioning models for fuselages, wing sets, and ship hull blocks before physical moves."
          },
          {
            name: "Hexagon Smart Yard",
            score: 76,
            whoIsItFor: "Commercial shipyards, offshore module fabricators, and heavy marine engineering yards managing structural steel cutting, panel assembly, and block staging.",
            architecture: "Yard Fabrication & Execution System",
            capabilities: "Integrates engineering design models with yard workflow management; tracks raw steel plate cutting and nesting; controls sub-assembly welding; and maps 3D block positioning from fabrication bays through drydock staging."
          },
          {
            name: "AVEVA ERM",
            score: 74,
            whoIsItFor: "Naval and commercial shipyards, offshore platform fabricators, and heavy industrial constructors managing high-volume structural plates and modular sub-assemblies.",
            architecture: "Marine & Plant Engineering Lifecycle Platform",
            capabilities: "Deep integration with marine engineering and design models; tracks raw plate steel, cut parts, and pipe spools through buffer zones, painting bays, and drydocks; and coordinates structural staging with outfitting schedules."
          },
          {
            name: "Siemens Tecnomatix",
            score: 72,
            whoIsItFor: "Aerospace tier-1 suppliers, turbomachinery builders, gas/wind turbine manufacturers, and complex discrete machinery fabricators.",
            architecture: "Digital Manufacturing Simulation & MOM",
            capabilities: "Tecnomatix provides plant/yard layout simulation and dynamic material-flow logistics; Opcenter tracks assembly line-side staging, material kitting, and work-in-progress (WIP) tracking for engineered-to-order components."
          },
          {
            name: "IFS Cloud",
            score: 70,
            whoIsItFor: "Commercial shipyards, aerospace builders, defense contractors, and heavy energy equipment manufacturers requiring tight project financial tracking.",
            architecture: "Project-Centric ERP & EAM Suite",
            capabilities: "Links staging yard inventory directly to Work Breakdown Structures (WBS); manages long-lead oversize components within strict project financial milestones; and unifies asset maintenance with yard inventory control."
          },
          {
            name: "DataDocks",
            score: 67,
            whoIsItFor: "Facilities that operate an on-site warehouse receiving supplies, replacement parts, hardware, and sub-assemblies in semi-trailers that require unloading with forklifts or by hand.",
            architecture: "Dock Scheduling & Yard Management System",
            capabilities: "Throttles incoming carrier arrivals via an online booking portal; eliminates gate and access road congestion; streamlines driver check-ins and dock door assignments; and tracks unloading turnaround times to minimize driver detention fees."
          },
          {
            name: "Hexagon Jovix",
            score: 65,
            whoIsItFor: "Renewable energy developers, wind turbine manufacturers, and industrial project sites managing massive components across wide-open laydown yards.",
            architecture: "Material Readiness & Mobile Field Management Platform",
            capabilities: "Active/passive RFID, GPS, and drone-sweeps for tracking oversize assets (wind turbine blades, heavy nacelles, structural beams); real-time GPS coordinate mapping in multi-acre laydown areas; and material readiness verification before field issuance."
          },
          {
            name: "Track'em",
            score: 62,
            whoIsItFor: "Regional renewable energy sites, turbine staging yards, and structural steel laydown yards requiring fast mobile deployment without heavy PLM overhead.",
            architecture: "Cloud Spatial Asset & Material Tracking System",
            capabilities: "Map-based visual asset tracking utilizing GPS, BLE beacons, and drone spatial mapping; tracks oversize structural steel, wind blades, and prefabricated modules; and provides a simple mobile interface for field crews to verify stock positions."
          }
        ]
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
        matches: [
          {
            name: "Command Alkon Apex",
            score: 78,
            whoIsItFor: "High-volume aggregate quarries, ready-mix facilities, asphalt plants, and mining logistics centers requiring automated scale ticketing and dispatch.",
            architecture: "Scale House Ticketing & Heavy Material Dispatch ERP",
            capabilities: "High-speed scale house ticketing with automated gross/tare/net weight capture; unattended driver scale kiosks with RFID and license plate recognition; centralized fleet dispatching; and automated quote-to-cash billing for bulk material sales."
          },
          {
            name: "Fast-Weigh",
            score: 75,
            whoIsItFor: "Regional aggregate producers, sand/gravel pits, and bulk haulers looking for a cloud-native ticketing system across multi-site yards.",
            architecture: "Cloud-Native Scale Ticketing & Yard Dispatch System",
            capabilities: "Fully digital e-ticketing via mobile apps for scale operators and drivers; unattended scale automation (NFC cards, driver touchscreens); real-time multi-site inventory sync; and integrated customer portal for ticketing data."
          },
          {
            name: "Propeller Aero",
            score: 73,
            whoIsItFor: "Quarry managers, survey teams, and inventory controllers requiring rapid, high-precision 3D volume calculations for bulk mineral stockpiles.",
            architecture: "3D Aerial Photogrammetry & Volumetric Surveying Platform",
            capabilities: "Drone-based 3D volumetric measurement for irregularly shaped bulk material stockpiles; cut-and-fill progress tracking for pit extraction; and automated survey-grade accuracy using ground control integrations (AeroPoints)."
          },
          {
            name: "Stockpile Reports",
            score: 70,
            whoIsItFor: "Finance teams, auditors, and yard managers needing continuous, audit-grade volumetric inventory reconciliation across aggregate stockyard networks.",
            architecture: "Continuous Volumetric Inventory & Stockpile Measurement Platform",
            capabilities: "On-demand 3D stockpile measurement via smartphone cameras, fixed site cameras, or drones; automatic conversion of 3D volume to tonnage using material density profiles; and audit-ready inventory reporting."
          },
          {
            name: "DataDocks",
            score: 68,
            whoIsItFor: "Operations with an on-site warehouse for receiving maintenance hardware, wear-liners, screening media, or bagged additives in semi-trailers that require unloading with forklifts or by hand.",
            architecture: "Dock Scheduling & Yard Management System",
            capabilities: "Throttles incoming carrier arrivals via an online booking portal; eliminates gate and access road congestion; streamlines driver check-ins and dock door assignments; and tracks unloading turnaround times to minimize driver detention fees."
          },
          {
            name: "Maptek PointStudio",
            score: 65,
            whoIsItFor: "Open-pit mines, major industrial quarries, and mining engineers managing highwall stability, pit design, and dense point-cloud laser scans.",
            architecture: "Geological Modeling & Mine Planning Suite",
            capabilities: "Processing of terrestrial LiDAR laser scans and drone point clouds for precise volume modeling; geological resource and raw deposit quality modeling; and highwall safety and slope stability analysis."
          },
          {
            name: "Carlson Mining",
            score: 63,
            whoIsItFor: "Mine engineers, site surveyors, and heavy earthmoving operators designing pit extensions, haul roads, and drill-and-blast patterns.",
            architecture: "Mine CAD Design & Machine Guidance Platform",
            capabilities: "Native CAD environment for designing pit faces, drainage, and haul roads; drill-and-blast pattern design; and direct telemetry integration with pit excavator and drill guidance hardware."
          },
          {
            name: "Scaleit W8",
            score: 60,
            whoIsItFor: "Quarries, aggregate producers, waste landfills, and scrap metal yards seeking a robust weighbridge scale management and load-ticketing tool.",
            architecture: "Weighbridge Scale & Yard Ticketing Software",
            capabilities: "Automated truck scale weighbridge ticketing, gross-tare-net calculation, license plate capture, unmanned driver kiosks, and material inventory logging."
          }
        ]
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
        matches: [
          {
            name: "Datacor",
            score: 78,
            whoIsItFor: "Chemical manufacturers, process batch producers, and chemical distributors operating packaged drum pads, tote yards, and indoor/outdoor staging areas.",
            architecture: "Chemical Process ERP & Specialized Chemical WMS",
            capabilities: "Cradle-to-grave lot genealogy and batch traceability; automated GHS/SDS hazard documentation and labeling; drum/tote lot control; automated hazmat compatibility segregation rules; and integrated container deposit/rental billing workflows."
          },
          {
            name: "TrackAbout",
            score: 75,
            whoIsItFor: "Chemical distributors, gas suppliers, and process manufacturers managing fleets of reusable IBC totes, stainless steel tanks, and chemical drums.",
            architecture: "Reusable Transport Item (RTI) & Bulk Asset Tracking System",
            capabilities: "Mobile barcode, QR, and RFID tracking for returnable totes and drums; maintenance tracking for re-testing dates, pressure checks, and cleaning certs; container loss/shrinkage reduction; and automated rental billing based on yard or customer site dwell time."
          },
          {
            name: "Kaleris YMS",
            score: 73,
            whoIsItFor: "Large-scale chemical processing plants, refineries, and bulk industrial complexes managing heavy outdoor trailer staging, tote yards, and spotter movements.",
            architecture: "Industrial Yard Execution System (YMS)",
            capabilities: "Real-time spatial mapping of outdoor staging blocks and bulk trailer spots; automated spotter truck tasking via RTLS/GPS; gate check-in automation; and yard dwell-time monitoring to prevent detention and demurrage fees on bulk chemical containers."
          },
          {
            name: "Royal 4 Systems",
            score: 70,
            whoIsItFor: "Regulated facilities, hazmat chemical warehouses, and outdoor drum/super-sack staging pads needing high spatial accuracy and safety enforcement.",
            architecture: "Hazmat-Compliant Warehouse & Yard Management System",
            capabilities: "Built-in OSHA, EPA, and DOT safety logic enforcing outdoor chemical drum compatibility rules; floor-stacked inventory management for FIBC super-sacks in open-air yards; and precision grid mapping (site, block, row, bay, tier) for fast mobile operator retrieval."
          },
          {
            name: "SAP Yard Logistics",
            score: 68,
            whoIsItFor: "Multinational chemical enterprises deeply integrated into SAP S/4HANA, Extended Warehouse Management (EWM), or Transportation Management (TM).",
            architecture: "Supply Chain & Yard Logistics Engine",
            capabilities: "Direct integration between back-office production orders and physical outdoor staging lots; configurable hazmat storage rules keeping incompatible chemicals separated; and unified tracking across outdoor staging blocks, rail sidings, and packaged container lots."
          },
          {
            name: "DataDocks",
            score: 66,
            whoIsItFor: "Facilities and yards that operate an on-site warehouse receiving supplies, empty IBCs, bags, and packaging hardware in semi-trailers that require unloading with forklifts or by hand.",
            architecture: "Dock Scheduling & Yard Management System",
            capabilities: "Throttles incoming carrier arrivals via an online booking portal; eliminates gate and access road congestion; streamlines driver check-ins and dock door assignments; and tracks unloading turnaround times to minimize driver detention fees."
          },
          {
            name: "Surgere Interius",
            score: 63,
            whoIsItFor: "High-density industrial yards holding massive fleets of returnable packaging, super-sack racks, and totes across broad outdoor acreage.",
            architecture: "IoT Sensor & Outdoor Asset Tracking Platform",
            capabilities: "Multi-sensor tracking (passive/active RFID, UWB, BLE, GPS) pinpointing exact physical coordinates on visual maps; automated asset movement logging without manual scanning; and real-time loss prevention for high-value outdoor containers."
          },
          {
            name: "C3 Yard",
            score: 60,
            whoIsItFor: "High-throughput packaged chemical staging sites and logistics hubs focused on gate flow, spotter management, and dock scheduling.",
            architecture: "Site and Yard Management System with Shunter Dispatch",
            capabilities: "Visual drag-and-drop yard mapping for drop-trailers and flatbed super-sack loads; driver self-service check-in kiosks; automated spotter tasking; and gate bottleneck elimination for inbound chemical carriers."
          }
        ]
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
        matches: [
          {
            name: "Trimble LIMS",
            score: 92,
            whoIsItFor: "Forest product companies, pulp and paper mills, and industrial sawmills managing timberland operations and central log yards.",
            architecture: "Forest Management & Log Yard Inventory System",
            capabilities: "Tracks raw wood inventory across multi-yard networks, manages scale-house weighbridge operations, calculates log volume and value by species/grade, and optimizes raw material feed to processing mills.",
            why: "Standard for sawmill woodyards. Flagship platform for forestry yard management."
          },
          {
            name: "3LOG LIMS",
            score: 88,
            whoIsItFor: "Industrial sawmills, timber processing plants, and wood receiving yards managing log inventory and wood receipt tracking.",
            architecture: "Timber Yard & Log Inventory Management Software",
            capabilities: "Log deck management, pile tracking, WeighWiz scale automation, and wood receipt inventory.",
            why: "Marketed to woodyard managers for log deck management and wood receipt inventory."
          },
          {
            name: "TIMBERplus",
            score: 85,
            whoIsItFor: "Timber merchants, veneer mills, and log yard operators conducting physical log deck tagging and timber grading.",
            architecture: "Timber & Log Yard Management System",
            capabilities: "Physical log deck tagging, barcode scanning, timber grading, and log pile inventory tracking.",
            why: "Built for physical log deck tagging and timber grading."
          },
          {
            name: "WoodPro InSight",
            score: 80,
            whoIsItFor: "Lumber distributors, sawmills, and reload yards managing lumber inventory and production tallying.",
            architecture: "Lumber & Reload Yard Inventory ERP",
            capabilities: "Lumber yard inventory tracking, sawmill production tallying, multi-unit conversions (board feet), barcode scanning in lumber reload yards, and shipment consolidation.",
            why: "Purpose-built for lumber yards, sawmills, and wood distribution centers."
          },
          {
            name: "TRACT Forestry",
            score: 75,
            whoIsItFor: "Wood suppliers, procurement teams, loggers, and sawmills managing timber supply chain logistics.",
            architecture: "Forestry Supply Chain & Log Deck Platform",
            capabilities: "Tracks wood from harvest tracts to woodyards and mills, provides digital scale ticketing, log inventory counts, and chain-of-custody tracking.",
            why: "Bridges harvest tract logging with woodyard inventory and mill receiving."
          },
          {
            name: "ForestMetrix",
            score: 65,
            whoIsItFor: "Forestry management firms, timberland managers, and log yard receiving operations conducting outdoor timber cruising, log grading, and yard intake tallying.",
            architecture: "Forestry Inventory & Timber Tallying Mobile Software",
            capabilities: "Enables mobile GPS tracking of standing timber and harvested log piles, automates timber volume calculations, tracks species and grade tallying, and syncs field data to log yard inventory systems.",
            why: "Relevant for log scaling and deck audits."
          },
          {
            name: "PlantDesk",
            score: 55,
            whoIsItFor: "Commercial wholesale plant nurseries, tree farms, and container yards managing live plant locations across growing beds.",
            architecture: "Nursery Yard & Dispatch Management Software",
            capabilities: "Live plant availability mapped across outdoor yard locations and beds, mobile-ready field crew picking and loading app, and delivery truck dispatching.",
            why: "Built specifically for outdoor nursery yards and tree farm stock management."
          },
          {
            name: "Arbré Nursery Software",
            score: 42,
            whoIsItFor: "Outdoor tree growing beds, silviculture plant nurseries, and container yards managing seedling production and bed inventory.",
            architecture: "Nursery & Tree Production Management Software",
            capabilities: "Tracks plant batches across outdoor growing fields using UHF RFID tags and mobile scanners, manages container inventory, and monitors plant development stages.",
            why: "Outdoor growing beds and tree container yard management."
          },
          {
            name: "DataDocks",
            score: 31,
            whoIsItFor: "Large sawmills, pulp/paper mills, and industrial wood yards that handle high-volume logging trucks, chip vans, and outbound finished lumber or paper roll flatbeds at gate scale-houses and loading dock doors.",
            architecture: "Dock Scheduling and Yard Management System",
            capabilities: "Scale-house driver appointment windows, dock door matrix management, carrier self-service portal, and trailer drop-lot visibility.",
            why: "Large pulp mills, paper mills, and industrial sawmills function similarly to heavy industrial logistics hubs, requiring dock door scheduling and gate queue management."
          }
        ]
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
        matches: [
          {
            name: "Performance Beef",
            score: 88,
            whoIsItFor: "Commercial cattle feedyards, livestock feeding operations, and feedlot yard managers tracking outdoor pen density and ration distribution.",
            architecture: "Feedlot Yard & Livestock Management Platform",
            capabilities: "Market leader in feedlot pen and bunk management, tracking cattle counts, feed delivery queues, and outdoor pen assignments.",
            why: "Market leader in feedlot pen and bunk management."
          },
          {
            name: "Elynx FY3000",
            score: 84,
            whoIsItFor: "Livestock holding yards, commercial feedlots, and cattle transit yards managing pen allocations and stock maintenance.",
            architecture: "Feedlot Yard & Stockyard Management Software",
            capabilities: "Purpose-built for livestock holding yards ('FY' = Feedlot Yard), pen assignments, animal tracking, and pen maintenance.",
            why: "Purpose-built for livestock holding yards, pen assignments, and pen maintenance."
          },
          {
            name: "AgriWebb",
            score: 78,
            whoIsItFor: "International livestock producers, pastoral ranches, and livestock holding yards managing outdoor stocking density and pen movements.",
            architecture: "Livestock Enterprise & Holding Yard Management System",
            capabilities: "Pasture and holding yard management, tracking pen movements, animal counts, and stocking density.",
            why: "Dominant across pasture and holding yard management."
          },
          {
            name: "Cattlytics",
            score: 65,
            whoIsItFor: "Cattle holding yards, feedlots, and livestock receiving operations tracking pen occupancy and herd health.",
            architecture: "Livestock Holding Pen & Feedlot Management Software",
            capabilities: "Tracks pen occupancy, animal receiving, pen-to-pen transfers, feeding schedules, and animal health holds across outdoor pens.",
            why: "Direct fit for livestock holding pens and feedlot yard operations."
          },
          {
            name: "Feedlot Tech",
            score: 55,
            whoIsItFor: "Outdoor cattle feedyards and livestock holding facilities managing feed bunk logistics and pen allocations.",
            architecture: "Feedyard Operations & Bunk Management Software",
            capabilities: "Manages outdoor feedlot pen assignments, feed delivery truck routing, and batch ration distribution.",
            why: "Functional alignment for outdoor feedlot yards."
          },
          {
            name: "SenseHub",
            score: 45,
            whoIsItFor: "Commercial stockyards, dairy facilities, and livestock holding yards tracking animal movements and motorized sorting gates.",
            architecture: "RFID Livestock Tracking & Sorting Gate System",
            capabilities: "Electronic RFID ear tag and collar tracking, automated 3-way sorting gate integration (Intelligate®-P), and pen health monitoring.",
            why: "Core technology for stockyards using automated sorting gates and RFID tracking."
          },
          {
            name: "DataDocks",
            score: 20,
            whoIsItFor: "Commercial feedlots, meat packing plants, and agricultural processing yards managing strict arrival appointment windows for livestock trailers, reefer (refrigerated) trucks, and bulk ingredient feed deliveries.",
            architecture: "Dock Scheduling and Yard Management System",
            capabilities: "Carrier appointment scheduling, reefer staging management, dock door queuing, and real-time gate turnaround tracking.",
            why: "Large meat packing plants, dairy processing yards, or commercial feedlots deal with strict appointment windows for livestock trailers, reefer staging, and driver arrival sequencing."
          }
        ]
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
        matches: [
          {
            name: "SoilFLO",
            score: 86,
            whoIsItFor: "Soil remediation yards, soil banks, biopile fields, and contaminated material treatment grounds.",
            architecture: "Soil Remediation & Soil Bank Yard Management System",
            capabilities: "Built explicitly for soil remediation yards, soil banks, and biopile fields to manage incoming material classifications, volume intake, and cell tracking.",
            why: "Built explicitly for soil remediation yards, soil banks, and biopile fields to manage incoming material classifications, volume intake, and cell tracking."
          },
          {
            name: "EarthSoft EQuIS",
            score: 74,
            whoIsItFor: "Environmental remediation sites, industrial cleanup projects, and environmental engineering firms managing soil treatment data.",
            architecture: "Environmental Data Management System (EDMS)",
            capabilities: "Global platform for environmental remediation sites, tracking soil sampling datasets, biopile contaminants, and regulatory compliance.",
            why: "Global platform for environmental remediation sites and biopile yards."
          },
          {
            name: "ESdat",
            score: 62,
            whoIsItFor: "Soil treatment pad managers, environmental consultants, and bioremediation fields tracking soil degradation metrics.",
            architecture: "Environmental Data & Soil Remediation Management System",
            capabilities: "Used across soil treatment pads to track biopile degradation (pH, moisture, contaminants) and generate environmental compliance reports.",
            why: "Used across soil treatment pads to track biopile degradation (pH, moisture, contaminants)."
          },
          {
            name: "SoilTrackers",
            score: 55,
            whoIsItFor: "Soil remediation yards, fill sites, and environmental cleanup pads tracking soil movement logs and regulatory permits.",
            architecture: "Soil Movement Tracking & Fill Site Compliance Platform",
            capabilities: "Digital fill site logging, real-time soil haul tracking from origin to disposal pad, volume calculation, and municipal compliance reporting.",
            why: "Dedicated platform for tracking soil movement and fill site remediation."
          },
          {
            name: "AMCS Platform",
            score: 48,
            whoIsItFor: "Soil bank operators, waste remediation pads, and material recycling yards managing scale ticketing and material processing cells.",
            architecture: "Recycling & Soil Bank Waste Management Platform",
            capabilities: "Scale house gross-tare-net ticketing, soil classification cell tracking, automated environmental invoicing, and regulatory reporting.",
            why: "Waste, recycling, and soil bank scale and cell tracking platform."
          },
          {
            name: "SampleServe",
            score: 42,
            whoIsItFor: "Field sampling technicians and environmental engineers conducting soil sample collection on remediation pads.",
            architecture: "Environmental Field Sampling & Chain-of-Custody Software",
            capabilities: "Workflow utility for field sampling on biopile pads, digital chain-of-custody tracking, and lab integration.",
            why: "Digital chain-of-custody and field sampling tool for remediation pads."
          },
          {
            name: "Geotech Enviro Data",
            score: 38,
            whoIsItFor: "Soil treatment grounds and environmental remediation sites managing soil testing databases.",
            architecture: "Environmental Database & Soil Site Software",
            capabilities: "Database for soil treatment grounds to log soil sample results and track remediation progress.",
            why: "Database for soil treatment grounds and testing sites."
          },
          {
            name: "DataDocks",
            score: 5,
            whoIsItFor: "High-volume soil processing centers, remediation pads, and waste transfer stations operating staging lots for shipping containers or drop-off roll-off boxes that need carrier appointment booking and dock/gate visibility.",
            architecture: "Dock Scheduling and Yard Management System",
            capabilities: "Inbound container delivery scheduling, gate check-in automation, trailer staging visibility, and dock-door allocation.",
            why: "If a high-volume soil processing center or contaminated waste transfer station uses staging lots for shipping containers or drop-off roll-off boxes that need location tracking across a large gravel footprint, a logistics YMS can provide visibility."
          }
        ]
      }
    ]
  }
];

/* ── Engine Hook ── */

export function createYardTypeEngine() {
  const [selectedCategoryId, setCategoryId] = createSignal<string | null>(null);
  const [selectedSubCatId, setSubCatId] = createSignal<string | null>(null);
  const [navDirection, setNavDirection] = createSignal<"forward" | "backward">("forward");

  const selectedCategory = createMemo(() => {
    const id = selectedCategoryId();
    return id ? (YARD_TAXONOMY.find((c) => c.id === id) ?? null) : null;
  });

  const selectedSubCategory = createMemo(() => {
    const cat = selectedCategory();
    const subId = selectedSubCatId();
    return cat && subId ? (cat.subCategories.find((s) => s.id === subId) ?? null) : null;
  });

  return {
    allCategories: YARD_TAXONOMY,
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
