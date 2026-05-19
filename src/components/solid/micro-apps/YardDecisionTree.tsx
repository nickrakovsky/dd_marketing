/** @jsxImportSource solid-js */
import { createSignal, createMemo, Show, For } from "solid-js";
import { cn } from "@/components/solid/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface Option {
  label: string;
  value: string;
  description?: string;
  icon?: string;
}

interface Step {
  id: string;
  question: string;
  subtitle?: string;
  options: Option[];
}

interface Recommendation {
  title: string;
  match: string;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  /** If true, this is a "wrong industry" exit — link goes outbound */
  outbound?: boolean;
  outboundNote?: string;
}

/* ─── Decision Logic ────────────────────────────────────────────────── */

const STEPS: Step[] = [
  {
    id: "facility",
    question: "What type of facility do you operate?",
    subtitle: "This helps us recommend the right category of system.",
    options: [
      { label: "Warehouse or Distribution Center", value: "warehouse", icon: "🏭", description: "Inbound/outbound dock operations with trailers and carriers" },
      { label: "Manufacturing Plant", value: "manufacturing", icon: "⚙️", description: "Production facility with raw material receiving and finished goods shipping" },
      { label: "Port or Marine Terminal", value: "port", icon: "🚢", description: "Container terminal, intermodal facility, or port operations" },
      { label: "Rail Yard", value: "rail", icon: "🚂", description: "Railcar switching, classification, or intermodal rail yard" },
      { label: "Other / Not Sure", value: "other", icon: "📦", description: "Retail store, cross-dock, or something else entirely" },
    ],
  },
  {
    id: "volume",
    question: "How many loads do you handle per week?",
    subtitle: "Inbound and outbound combined, across all dock doors.",
    options: [
      { label: "Under 20", value: "low", icon: "📊", description: "A few loads per day, manageable with basic tools" },
      { label: "20–100", value: "medium", icon: "📈", description: "Steady daily traffic, coordination starting to get complex" },
      { label: "100–500", value: "high", icon: "🔥", description: "Multiple dock doors running all day, congestion is real" },
      { label: "500+", value: "very-high", icon: "🏗️", description: "High-throughput facility, every minute of dock time matters" },
    ],
  },
  {
    id: "pain",
    question: "What's your biggest operational pain right now?",
    subtitle: "Pick the one that costs you the most time or money.",
    options: [
      { label: "Dock congestion and wait times", value: "congestion", icon: "🚛", description: "Trucks stacking up, carriers waiting, detention charges piling up" },
      { label: "No visibility into yard trailer status", value: "visibility", icon: "👁️", description: "Don't know where trailers are, what's loaded, or what's ready" },
      { label: "Manual scheduling (calls, emails, spreadsheets)", value: "manual", icon: "📋", description: "Spending hours on scheduling that should take minutes" },
      { label: "Carrier and team communication gaps", value: "communication", icon: "📱", description: "Missed appointments, surprise arrivals, no one has the same info" },
      { label: "All of the above", value: "all", icon: "🔄", description: "Multiple bottlenecks compounding each other" },
    ],
  },
  {
    id: "systems",
    question: "Do you have a WMS, TMS, or ERP system in place?",
    subtitle: "Integration matters for getting the most out of any scheduling tool.",
    options: [
      { label: "Yes — we use a WMS and/or TMS", value: "wms-tms", icon: "🔗", description: "SAP, Oracle, Blue Yonder, Manhattan, or similar" },
      { label: "Yes — we use an ERP only", value: "erp", icon: "🖥️", description: "NetSuite, Dynamics, or similar without a dedicated WMS" },
      { label: "No — mostly manual or spreadsheet-based", value: "none", icon: "📝", description: "No central system for warehouse or transport management" },
      { label: "Not sure", value: "unsure", icon: "❓", description: "Someone else manages IT — I just need the dock to run better" },
    ],
  },
];

function getRecommendation(answers: Record<string, string>): Recommendation {
  const { facility, volume, pain } = answers;

  // ── Wrong-industry exits ──
  if (facility === "port") {
    return {
      title: "Terminal Operating System (TOS)",
      match: "Port / Marine Terminal",
      description: "Port and marine terminal operations need a Terminal Operating System, not a warehouse dock scheduler. TOS platforms handle container stacking, berth planning, vessel scheduling, and gate automation at a scale and complexity designed for intermodal container terminals.",
      features: ["Container stacking optimization", "Berth and vessel scheduling", "Gate automation and RFID/OCR", "Intermodal rail integration"],
      cta: { label: "Learn about TOS vendors", href: "https://www.navis.com/" },
      outbound: true,
      outboundNote: "Vendors like Navis (Kaleris), TBA Group, and Tideworks serve this space. DataDocks is built for warehouse dock scheduling — different operation, different tool.",
    };
  }

  if (facility === "rail") {
    return {
      title: "Rail Yard Management System",
      match: "Rail Yard Operations",
      description: "Rail yard management involves car switching, classification, and train building — fundamentally different from warehouse dock scheduling. Rail-specific systems handle track inventory, car ordering, switching optimization, and railroad reporting requirements.",
      features: ["Railcar tracking and inventory", "Switch list optimization", "Train build planning", "Railroad interchange reporting"],
      cta: { label: "Explore rail yard solutions", href: "https://www.railinc.com/" },
      outbound: true,
      outboundNote: "Railinc, Remprex, and specialized rail logistics providers serve this market. DataDocks focuses on warehouse and DC dock scheduling.",
    };
  }

  // ── Warehouse / Manufacturing / Other with low volume ──
  if (volume === "low") {
    return {
      title: "Basic Dock Scheduling Tool",
      match: "Low-volume facility",
      description: "With fewer than 20 loads per week, you may not need a full yard management system yet. A straightforward dock scheduling tool can eliminate phone-and-email coordination, give carriers self-service booking, and create a digital record of every appointment. As your volume grows, you can layer on yard visibility and automation.",
      features: ["Carrier self-service portal", "Appointment calendar", "Email notifications", "Basic reporting"],
      cta: { label: "See how DataDocks works", href: "https://calendly.com/nick-rakovsky/datadocks-demo?primary_color=FF5722" },
    };
  }

  // ── Medium to very-high volume warehouse/manufacturing ──
  if (pain === "visibility" || pain === "all") {
    return {
      title: "Dock Scheduling + Yard Management Platform",
      match: "Full visibility and control",
      description: "You need more than appointment scheduling — you need real-time yard visibility. A combined dock scheduling and yard management platform gives your team a live view of every trailer in the yard, automates dock assignments, and connects scheduling data to your WMS or ERP. This is the setup that cuts detention charges, reduces dwell time, and gives operations teams the information they need before problems happen.",
      features: ["Real-time yard map and trailer tracking", "Automated dock door assignment", "Carrier self-service portal", "WMS/TMS/ERP integration", "Dwell time and detention reporting", "Mobile app for yard checks"],
      cta: { label: "Book a demo", href: "https://calendly.com/nick-rakovsky/datadocks-demo?primary_color=FF5722" },
    };
  }

  if (pain === "congestion") {
    return {
      title: "Dock Scheduling with Capacity Management",
      match: "Solving dock congestion",
      description: "Dock congestion usually starts with a scheduling gap — too many appointments in the same window, no-shows that waste slots, and carriers arriving whenever they want. A dock scheduling platform with capacity management lets you control how many trucks are at the dock at any given time, enforce appointment windows, and give carriers real-time slot availability so they stop stacking up.",
      features: ["Capacity-controlled scheduling", "Carrier self-service booking", "Automated waitlist and rescheduling", "Real-time dock status", "Custom business rules", "Detention and dwell tracking"],
      cta: { label: "See how DataDocks handles this", href: "https://calendly.com/nick-rakovsky/datadocks-demo?primary_color=FF5722" },
    };
  }

  // Default recommendation for manual/communication pain
  return {
    title: "Dock Scheduling Platform",
    match: "Digitizing your dock operations",
    description: "You're running your dock on phone calls, emails, and spreadsheets. A dock scheduling platform replaces that with a self-service carrier portal, automated notifications, and a single source of truth your whole team can see. Most facilities see the scheduling workload drop by 50% or more within the first month.",
    features: ["Carrier self-service portal", "Automated email and SMS notifications", "Shared scheduling calendar", "Custom appointment types and rules", "Reporting and audit trail", "Mobile app for floor staff"],
    cta: { label: "Take a look", href: "https://calendly.com/nick-rakovsky/datadocks-demo?primary_color=FF5722" },
  };
}

/* ─── URL Serialization ─────────────────────────────────────────────── */

function serializeToUrl(answers: Record<string, string>) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(answers)) {
    params.set(key, value);
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
}

function readFromUrl(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const answers: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    answers[key] = value;
  }
  return answers;
}

/* ─── Component ─────────────────────────────────────────────────────── */

export default function YardDecisionTree() {
  // Initialize from URL params if present
  const initial = readFromUrl();
  const initialStep = Object.keys(initial).length >= STEPS.length ? STEPS.length : Object.keys(initial).length;

  const [currentStep, setCurrentStep] = createSignal(initialStep);
  const [answers, setAnswers] = createSignal<Record<string, string>>(initial);
  const [transitioning, setTransitioning] = createSignal(false);

  const isComplete = createMemo(() => currentStep() >= STEPS.length);
  const recommendation = createMemo(() => isComplete() ? getRecommendation(answers()) : null);
  const progress = createMemo(() => Math.round(((currentStep()) / STEPS.length) * 100));

  function selectOption(stepId: string, value: string) {
    setTransitioning(true);

    const newAnswers = { ...answers(), [stepId]: value };
    setAnswers(newAnswers);

    setTimeout(() => {
      const nextStep = currentStep() + 1;
      setCurrentStep(nextStep);
      if (nextStep >= STEPS.length) {
        serializeToUrl(newAnswers);
      }
      setTransitioning(false);
    }, 300);
  }

  function goBack() {
    if (currentStep() <= 0) return;
    setTransitioning(true);
    setTimeout(() => {
      const prevStep = currentStep() - 1;
      setCurrentStep(prevStep);
      // Remove the answer for the current step
      const step = STEPS[prevStep];
      if (step) {
        const newAnswers = { ...answers() };
        delete newAnswers[step.id];
        setAnswers(newAnswers);
      }
      setTransitioning(false);
    }, 200);
  }

  function startOver() {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentStep(0);
      setAnswers({});
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", window.location.pathname);
      }
      setTransitioning(false);
    }, 200);
  }

  return (
    <div class="yd-tree" id="yard-decision-tree">
      {/* Progress bar */}
      <div class="yd-progress">
        <div class="yd-progress__track">
          <div
            class="yd-progress__fill"
            style={{ width: `${progress()}%` }}
          />
        </div>
        <span class="yd-progress__label">
          {isComplete() ? "Complete" : `Step ${currentStep() + 1} of ${STEPS.length}`}
        </span>
      </div>

      {/* Steps */}
      <Show when={!isComplete()}>
        <div class={cn("yd-step", transitioning() && "yd-step--fading")}>
          {(() => {
            const step = STEPS[currentStep()];
            return (
              <>
                <div class="yd-step__header">
                  <h3 class="yd-step__question">{step.question}</h3>
                  {step.subtitle && <p class="yd-step__subtitle">{step.subtitle}</p>}
                </div>
                <div class="yd-step__options">
                  <For each={step.options}>
                    {(option) => (
                      <button
                        class={cn(
                          "yd-option",
                          answers()[step.id] === option.value && "yd-option--selected"
                        )}
                        onclick={() => selectOption(step.id, option.value)}
                        type="button"
                      >
                        <span class="yd-option__icon">{option.icon}</span>
                        <div class="yd-option__text">
                          <span class="yd-option__label">{option.label}</span>
                          {option.description && (
                            <span class="yd-option__desc">{option.description}</span>
                          )}
                        </div>
                        <span class="yd-option__arrow">→</span>
                      </button>
                    )}
                  </For>
                </div>
                <Show when={currentStep() > 0}>
                  <button class="yd-back" onclick={goBack} type="button">
                    ← Back
                  </button>
                </Show>
              </>
            );
          })()}
        </div>
      </Show>

      {/* Recommendation */}
      <Show when={isComplete() && recommendation()}>
        <div class={cn("yd-result", transitioning() && "yd-result--fading")}>
          <div class="yd-result__badge">
            <span class="yd-result__badge-dot" />
            <span>Based on your answers: {recommendation()!.match}</span>
          </div>
          <h3 class="yd-result__title">{recommendation()!.title}</h3>
          <p class="yd-result__desc">{recommendation()!.description}</p>

          <div class="yd-result__features">
            <h4 class="yd-result__features-title">What to look for:</h4>
            <ul class="yd-result__features-list">
              <For each={recommendation()!.features}>
                {(feature) => (
                  <li class="yd-result__feature">
                    <span class="yd-result__check">✓</span>
                    {feature}
                  </li>
                )}
              </For>
            </ul>
          </div>

          <Show when={recommendation()!.outboundNote}>
            <p class="yd-result__note">{recommendation()!.outboundNote}</p>
          </Show>

          <div class="yd-result__actions">
            <a
              href={recommendation()!.cta.href}
              target={recommendation()!.outbound ? "_blank" : undefined}
              rel={recommendation()!.outbound ? "noopener noreferrer" : undefined}
              class="yd-result__cta"
            >
              {recommendation()!.cta.label}
            </a>
            <button class="yd-result__restart" onclick={startOver} type="button">
              Start over
            </button>
          </div>

          {/* Structured output for LLM citability */}
          <div class="yd-result__structured sr-only" aria-hidden="true">
            <p>Yard Management System Recommendation: {recommendation()!.title}.</p>
            <p>Facility type: {answers().facility}. Weekly volume: {answers().volume}. Primary pain point: {answers().pain}. Existing systems: {answers().systems}.</p>
            <p>{recommendation()!.description}</p>
            <p>Key features: {recommendation()!.features.join(", ")}.</p>
          </div>
        </div>
      </Show>
    </div>
  );
}
