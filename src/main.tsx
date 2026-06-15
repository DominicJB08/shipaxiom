import React, { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Code2,
  DatabaseZap,
  FileSearch,
  Gavel,
  HeartPulse,
  Inbox,
  KeyRound,
  LineChart,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Map,
  MousePointerClick,
  Phone,
  Play,
  RefreshCw,
  Rocket,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  X,
  Users,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./styles.css";

type StackKey = "remote" | "local" | "appliance";
type LeadStatus = "new" | "contacted" | "qualified" | "booked" | "won" | "lost" | "archived";
type SiteRoute =
  | "/"
  | "/services"
  | "/services/ai-workflow-audit"
  | "/services/ship-sprint"
  | "/services/ops-care"
  | "/industries"
  | "/industries/healthcare-admin"
  | "/industries/law-firms"
  | "/industries/accounting-tax"
  | "/industries/b2b-services"
  | "/process"
  | "/security"
  | "/pricing"
  | "/case-studies"
  | "/sample-audit"
  | "/analytics"
  | "/book-audit"
  | "/about"
  | "/privacy"
  | "/terms"
  | "/cookie-policy";

type AdminLead = {
  id: number;
  created_at: string;
  name: string;
  email: string;
  company: string;
  phone: string | null;
  industry: string;
  team_size: string;
  budget: string;
  preferred_time: string | null;
  workflow: string;
  privacy_needs: string | null;
  package_interest: string;
  source: string;
  status: LeadStatus;
};

type AnalyticsSummary = {
  range: { days: number; since: string };
  totals: {
    pageViews: number;
    ctaClicks: number;
    formStarts: number;
    formAttempts: number;
    formErrors: number;
    formSubmits: number;
    sampleAuditViews: number;
    sampleAuditGenerates: number;
    pricingSelections: number;
    mailClicks: number;
    phoneClicks: number;
    videoEvents: number;
    conversionRate: number;
  };
  funnel: Array<{ stage: string; total: number }>;
  topPages: Array<{ page_path: string; views: number; sessions: number }>;
  topCtas: Array<{ cta_id: string; clicks: number }>;
  daily: Array<{ day: string; page_views: number; cta_clicks: number; form_starts: number; form_submits: number }>;
  video: Array<{ milestone: number; total: number }>;
  recentEvents: Array<Record<string, unknown>>;
};

type TrackPayload = {
  eventName: string;
  ctaId?: string;
  sectionId?: string;
  formStep?: string;
  packageInterest?: string;
  videoId?: string;
  videoMilestone?: number;
};

const navItems = [
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Process", href: "/process" },
  { label: "Security", href: "/security" },
  { label: "Proof", href: "/case-studies" },
  { label: "Analytics", href: "/analytics" },
  { label: "Pricing", href: "/pricing" }
];

const routeMeta: Record<SiteRoute, { title: string; description: string }> = {
  "/": {
    title: "Ship Axiom | Private AI workflow automation",
    description: "Private AI workflow audits, pilots, and analytics for sensitive service teams."
  },
  "/services": {
    title: "Services | Ship Axiom",
    description: "Paid AI workflow audits, ship sprints, and ongoing optimization support."
  },
  "/services/ai-workflow-audit": {
    title: "AI Workflow Audit | Ship Axiom",
    description: "Map one repetitive workflow, score automation opportunities, and define privacy boundaries."
  },
  "/services/ship-sprint": {
    title: "Ship Sprint | Ship Axiom",
    description: "Build and test one private AI workflow with review checkpoints in 7 days."
  },
  "/services/ops-care": {
    title: "Ops Care | Ship Axiom",
    description: "Monitor workflow analytics, improve prompts, and maintain private AI automations."
  },
  "/industries": {
    title: "Industries | Ship Axiom",
    description: "AI workflow playbooks for healthcare admin, law firms, accounting, and B2B services."
  },
  "/industries/healthcare-admin": {
    title: "Healthcare Admin AI Workflows | Ship Axiom",
    description: "Private AI workflow examples for clinic intake, insurance, and administrative review."
  },
  "/industries/law-firms": {
    title: "Law Firm AI Workflows | Ship Axiom",
    description: "AI workflow examples for legal intake, discovery triage, and client follow-up."
  },
  "/industries/accounting-tax": {
    title: "Accounting AI Workflows | Ship Axiom",
    description: "AI workflow examples for document chase lists, reports, and client Q&A sorting."
  },
  "/industries/b2b-services": {
    title: "B2B Service AI Workflows | Ship Axiom",
    description: "AI workflow examples for lead qualification, proposals, and renewal risk notes."
  },
  "/process": {
    title: "Process | Ship Axiom",
    description: "A lead-orchestrated, six-reviewer workflow for safer AI implementation."
  },
  "/security": {
    title: "Security | Ship Axiom",
    description: "Data minimization, first-party analytics, signed admin sessions, and human approval gates."
  },
  "/pricing": {
    title: "Pricing | Ship Axiom",
    description: "Start with a workflow audit, then fund a sprint or ongoing AI ops care."
  },
  "/case-studies": {
    title: "Proof | Ship Axiom",
    description: "Example workflow outcomes and measurable private AI delivery patterns."
  },
  "/sample-audit": {
    title: "Sample Audit | Ship Axiom",
    description: "A sample workflow audit with scores, privacy boundaries, and measurement points."
  },
  "/analytics": {
    title: "Analytics | Ship Axiom",
    description: "What Ship Axiom tracks, what it avoids tracking, and how optimization works."
  },
  "/book-audit": {
    title: "Book Audit | Ship Axiom",
    description: "Request a workflow fit call without submitting sensitive records."
  },
  "/about": {
    title: "About | Ship Axiom",
    description: "Practical private AI delivery for service businesses with sensitive admin work."
  },
  "/privacy": {
    title: "Privacy Policy | Ship Axiom",
    description: "How Ship Axiom collects, uses, protects, and retains website information."
  },
  "/terms": {
    title: "Terms | Ship Axiom",
    description: "Website terms for Ship Axiom."
  },
  "/cookie-policy": {
    title: "Cookie Policy | Ship Axiom",
    description: "Strictly necessary admin cookies and first-party cookieless analytics."
  }
};

const footerGroups = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Process", href: "/process" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Sample Audit", href: "/sample-audit" }
    ]
  },
  {
    title: "Services",
    links: [
      { label: "AI Workflow Audit", href: "/services/ai-workflow-audit" },
      { label: "Ship Sprint", href: "/services/ship-sprint" },
      { label: "Ops Care", href: "/services/ops-care" },
      { label: "Pricing", href: "/pricing" }
    ]
  },
  {
    title: "Trust",
    links: [
      { label: "Security", href: "/security" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookie Policy", href: "/cookie-policy" }
    ]
  }
];

const pricing = [
  {
    title: "AI Workflow Audit",
    price: "$2,500",
    note: "One-time",
    href: "/services/ai-workflow-audit",
    bullets: ["Workflow and system map", "Opportunity scoring", "Privacy boundary review", "Pilot scope and quote"]
  },
  {
    title: "Ship Sprint",
    price: "$9,500",
    note: "Fixed scope",
    href: "/services/ship-sprint",
    featured: true,
    bullets: ["Everything in the audit", "Build and test one workflow", "Private deployment path", "30-day handover support"]
  },
  {
    title: "Ops Care",
    price: "$1,250",
    note: "Per month",
    href: "/services/ops-care",
    bullets: ["Workflow improvements", "New automations", "Monitoring and guardrails", "Priority support"]
  }
];

const stackCards: Record<StackKey, { title: string; sub: string; detail: string; stat: string }> = {
  remote: {
    title: "Remote private workspace",
    sub: "Default pilot path",
    detail: "Private build environment for intake, prompts, automation logic, and review artifacts without buying hardware first.",
    stat: "Default"
  },
  local: {
    title: "Client-owned Mac or server",
    sub: "Local install path",
    detail: "When a client already has suitable hardware, we install and document the local workflow remotely.",
    stat: "Local ready"
  },
  appliance: {
    title: "On-site appliance build",
    sub: "Scoped add-on",
    detail: "Quoted only when the client needs on-prem hardware and funds the machine, travel, and setup.",
    stat: "Add-on"
  }
};

const industryCards = [
  {
    title: "Healthcare admin",
    href: "/industries/healthcare-admin",
    icon: HeartPulse,
    workflows: ["Intake packet review", "Prior auth draft", "Insurance verification"],
    proof: "45 min to 6 min per packet"
  },
  {
    title: "Law firms",
    href: "/industries/law-firms",
    icon: Gavel,
    workflows: ["Matter intake summary", "Discovery packet triage", "Client follow-up drafts"],
    proof: "Human review stays mandatory"
  },
  {
    title: "Accounting & tax",
    href: "/industries/accounting-tax",
    icon: BarChart3,
    workflows: ["Document chase lists", "Monthly report drafts", "Client Q&A sorting"],
    proof: "Structured handoff for staff"
  },
  {
    title: "B2B services",
    href: "/industries/b2b-services",
    icon: BriefcaseBusiness,
    workflows: ["Lead qualification", "Proposal intake", "Renewal risk notes"],
    proof: "Fast pilot without new hardware"
  }
];

const processSteps = [
  { title: "Map", text: "We document the repetitive workflow, systems, owners, and data boundaries.", icon: FileSearch },
  { title: "Score", text: "We rank opportunities by time saved, risk, implementation effort, and buyer value.", icon: Target },
  { title: "Design", text: "We specify prompts, controls, human review gates, and measurement events.", icon: Code2 },
  { title: "Build", text: "We ship the first workflow in a private workspace with observable checkpoints.", icon: Bot },
  { title: "Validate", text: "Six focused reviewers test copy, UX, security, analytics, performance, and browser behavior.", icon: Users },
  { title: "Deploy", text: "We deploy remotely first, then move local only when the client needs it.", icon: Rocket },
  { title: "Measure", text: "The admin dashboard shows what converts, what breaks, and what to improve next.", icon: LineChart }
];

const judgeLoop = [
  "Product and information architecture",
  "Conversion copy and offer clarity",
  "Frontend UX, accessibility, and responsive layout",
  "Privacy, security, and data minimization",
  "Analytics, funnel, and admin reporting",
  "Live browser QA and regression testing"
];

const sampleAuditRows = [
  { source: "Intake form PDF", output: "Structured fields + reviewer summary", score: 94, saved: "39 min", risk: "Medium" },
  { source: "Prior auth packet", output: "Draft packet checklist", score: 88, saved: "28 min", risk: "High" },
  { source: "Insurance verification", output: "Exception queue", score: 82, saved: "18 min", risk: "Medium" },
  { source: "Monthly clinic report", output: "Draft narrative + metrics", score: 71, saved: "2.5 hr/mo", risk: "Low" }
];

const leadStatuses: LeadStatus[] = ["new", "contacted", "qualified", "booked", "won", "lost", "archived"];

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  booked: "Booked",
  won: "Won",
  lost: "Lost",
  archived: "Archived"
};

function App() {
  const route = normalizeRoute(window.location.pathname);
  const [selectedPlan, setSelectedPlan] = useState("Ship Sprint");

  useEffect(() => {
    if (route !== "/admin") {
      const meta = routeMeta[route];
      document.title = meta.title;
      document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", meta.description);
    }
    trackEvent({ eventName: "page_view" });
  }, [route]);

  if (route === "/admin") {
    return <AdminApp />;
  }

  return (
    <main>
      <SiteHeader />
      <RoutePage route={route} selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
      <SiteFooter />
    </main>
  );
}

function RoutePage({
  route,
  selectedPlan,
  setSelectedPlan
}: {
  route: string;
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
}) {
  if (route.startsWith("/services/")) {
    return <ServiceDetailPage route={route} selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />;
  }

  if (route === "/industries") {
    return <IndustriesPage />;
  }

  if (route.startsWith("/industries/")) {
    return <IndustryPage route={route} />;
  }

  switch (route) {
    case "/services":
      return <ServicesPage />;
    case "/process":
      return <ProcessPage />;
    case "/security":
      return <SecurityPage />;
    case "/pricing":
      return <PricingPage selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />;
    case "/case-studies":
      return <CaseStudiesPage />;
    case "/sample-audit":
      return <SampleAuditPage />;
    case "/analytics":
      return <AnalyticsPage />;
    case "/book-audit":
      return <BookAuditPage selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />;
    case "/about":
      return <AboutPage />;
    case "/privacy":
      return <PrivacyPage />;
    case "/terms":
      return <TermsPage />;
    case "/cookie-policy":
      return <CookiePolicyPage />;
    default:
      return <HomePage selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />;
  }
}

function HomePage({
  selectedPlan,
  setSelectedPlan
}: {
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
}) {
  const [stack, setStack] = useState<StackKey>("remote");
  const stackInfo = stackCards[stack];

  return (
    <>
      <section className="hero section-shell">
        <div className="hero-copy">
          <h1>Private AI workflow automation for sensitive service teams.</h1>
          <p>
            Ship Axiom maps one repetitive admin workflow, proves the safest automation path,
            and ships a reviewed pilot in 7 days without forcing an upfront hardware purchase.
          </p>
          <div className="hero-actions">
            <TrackedLink className="primary-action" href="/sample-audit" ctaId="hero-view-sample-audit">
              <Sparkles size={18} />
              View sample audit
            </TrackedLink>
            <TrackedLink className="secondary-action" href="/book-audit" ctaId="hero-book-audit">
              Book fit call
              <ChevronRight size={17} />
            </TrackedLink>
          </div>
          <div className="trust-row" aria-label="Key promises">
            <TrustItem icon={LockKeyhole} title="Privacy-first by default" text="Sensitive data stays scoped, minimized, and reviewed." />
            <TrustItem icon={ShieldCheck} title="Human in the loop" text="Every output has a clear approval gate." />
            <TrustItem icon={LineChart} title="Measured funnel" text="Page, CTA, form, and video analytics show what to optimize." />
          </div>
        </div>
        <AuditCockpit stack={stack} setStack={setStack} stackInfo={stackInfo} />
      </section>

      <section className="signal-strip">
        <Signal label="Pilot length" value="7 days" />
        <Signal label="Example time saved" value="39 min / packet" />
        <Signal label="Default deployment" value="Remote private workspace" />
        <Signal label="Review model" value="Six-judge QA loop" />
      </section>

      <IndustryPreview />
      <VideoSection />
      <SampleAuditTeaser />
      <DeliverySection stack={stack} setStack={setStack} />
      <AnalyticsPreview />
      <PricingSection selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
      <FinalCta selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
    </>
  );
}

function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={`site-header ${mobileOpen ? "menu-open" : ""}`}>
      <a className="brand" href="/" aria-label="Ship Axiom home">
        <span className="brand-mark"><span /></span>
        <span>Ship Axiom</span>
      </a>
      <button
        className="mobile-menu-button"
        type="button"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileOpen}
        aria-controls="primary-navigation"
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav id="primary-navigation" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>{item.label}</a>
        ))}
      </nav>
      <TrackedLink className="header-cta" href="/book-audit" ctaId="header-book-audit">
        Book audit
        <ArrowRight size={16} strokeWidth={2.4} />
      </TrackedLink>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer expanded">
      <div>
        <a className="brand small" href="/">
          <span className="brand-mark"><span /></span>
          <span>Ship Axiom</span>
        </a>
        <p>Private AI workflow audits, pilots, and optimization dashboards for service teams.</p>
        <span>© 2026 Ship Axiom.</span>
      </div>
      {footerGroups.map((group) => (
        <nav aria-label={group.title} key={group.title}>
          <strong>{group.title}</strong>
          {group.links.map((link) => (
            <a href={link.href} key={link.href}>{link.label}</a>
          ))}
        </nav>
      ))}
    </footer>
  );
}

function TrustItem({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="trust-item">
      <Icon size={18} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="signal">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function IndustryPreview() {
  return (
    <section className="page-band">
      <div className="section-shell split-heading">
        <div className="section-heading">
          <h2>Buyer paths with real workflow detail.</h2>
          <p>Each industry page explains what we automate, what stays human-reviewed, and which data boundaries matter.</p>
        </div>
        <div className="industry-grid">
          {industryCards.map(({ title, href, icon: Icon, workflows, proof }) => (
            <a className="industry-card" href={href} key={href}>
              <Icon size={24} />
              <h3>{title}</h3>
              <p>{proof}</p>
              <ul>
                {workflows.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoSection() {
  const milestones = useRef(new Set<number>());
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  async function playDemo() {
    try {
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
      await videoRef.current?.play();
    } catch {
      setVideoPlaying(false);
    }
  }

  function progress(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    if (!video.duration) return;
    const percent = Math.round((video.currentTime / video.duration) * 100);
    [25, 50, 75, 90].forEach((milestone) => {
      if (percent >= milestone && !milestones.current.has(milestone)) {
        milestones.current.add(milestone);
        trackEvent({ eventName: "video_progress", videoId: "workflow-demo", videoMilestone: milestone });
      }
    });
  }

  return (
    <section className="video-section section-shell">
      <div className="section-heading video-heading">
        <h2>Manual work vs AI-assisted review.</h2>
        <p>An intake packet becomes structured fields, a summary, and a human-approved task list without removing staff from the decision.</p>
        <div className="saving-metrics" aria-label="Workflow time comparison">
          <span><strong>45 min</strong> human-only</span>
          <span><strong>6 min</strong> AI-assisted</span>
          <span><strong>39 min</strong> saved per packet</span>
        </div>
      </div>
      <div className="video-shell">
        <video
          ref={videoRef}
          controls
          playsInline
          muted
          preload="metadata"
          poster="/media/workflow-demo-poster.jpg"
          aria-label="Ship Axiom example workflow video comparing manual intake review with AI-assisted review"
          onPlay={() => {
            setVideoPlaying(true);
            trackEvent({ eventName: "video_play", videoId: "workflow-demo", videoMilestone: 0 });
          }}
          onPause={() => setVideoPlaying(false)}
          onTimeUpdate={progress}
          onEnded={() => {
            setVideoPlaying(false);
            trackEvent({ eventName: "video_complete", videoId: "workflow-demo", videoMilestone: 100 });
          }}
        >
          <source src="/media/workflow-demo.mp4" type="video/mp4" />
          <source src="/media/workflow-demo.webm" type="video/webm" />
        </video>
        <button
          className={`video-play-button ${videoPlaying ? "is-playing" : ""}`}
          type="button"
          onClick={() => void playDemo()}
          aria-label="Play Ship Axiom workflow demo video"
        >
          <Play size={20} fill="currentColor" />
          Play demo
        </button>
      </div>
    </section>
  );
}

function SampleAuditTeaser() {
  return (
    <section className="sample-section section-shell">
      <div className="section-heading">
        <h2>Sample audit output you can inspect.</h2>
        <p>The previous button now opens a real page with scored opportunities, measurement events, and delivery decisions.</p>
        <TrackedLink className="text-button" href="/sample-audit" ctaId="sample-audit-teaser">
          View full sample audit <ArrowRight size={15} />
        </TrackedLink>
      </div>
      {sampleAuditRows.slice(0, 3).map((row, index) => (
        <article className="opportunity-panel" key={row.source}>
          <span className="panel-index">{index + 1}</span>
          <h3>{row.source}</h3>
          <p>{row.output}</p>
          <div className="mini-list">
            <span>Opportunity score: {row.score}</span>
            <span>Time saved: {row.saved}</span>
            <span>Risk: {row.risk}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function DeliverySection({ stack, setStack }: { stack: StackKey; setStack: (key: StackKey) => void }) {
  return (
    <section className="model-section section-shell">
      <div className="section-heading model-heading">
        <h2>Right environment. Right job.</h2>
        <p>We start remote-first so the pilot can sell and ship quickly. Local deployment is available when the client already has hardware or funds it as an add-on.</p>
        <TrackedLink href="/security" ctaId="delivery-security">Read the security model <ArrowRight size={15} /></TrackedLink>
      </div>
      <div className="stack-table" role="table" aria-label="Private delivery model comparison">
        <div className="stack-row stack-head" role="row">
          <span>Path</span>
          <span>Use for</span>
          <span>Cost risk</span>
          <span>Default?</span>
        </div>
        <StackRow active={stack === "remote"} onClick={() => setStack("remote")} label="Default" model="Remote private workspace" use="Audit, workflow build, automation logic, review artifacts" quant="Low" />
        <StackRow active={stack === "local"} onClick={() => setStack("local")} label="Local if available" model="Client-owned Mac or server" use="Sensitive workflows where the client already owns suitable hardware" quant="Medium" />
        <StackRow active={stack === "appliance"} onClick={() => setStack("appliance")} label="Add-on" model="On-site appliance build" use="Air-gapped or regulated clients that fund hardware, travel, and setup" quant="Quoted" />
      </div>
    </section>
  );
}

function AnalyticsPreview() {
  return (
    <section className="analytics-preview section-shell">
      <div className="section-heading">
        <h2>Analytics you can actually use.</h2>
        <p>First-party, cookieless events show what content converts without storing keystrokes, full IP addresses, or form values.</p>
      </div>
      <div className="analytics-console">
        <div className="metric-card"><span>Page views</span><strong>Tracked</strong><small>By route and device class</small></div>
        <div className="metric-card"><span>CTA clicks</span><strong>Tracked</strong><small>Header, hero, pricing, audit</small></div>
        <div className="metric-card"><span>Form funnel</span><strong>Tracked</strong><small>Start, submit, success, error</small></div>
        <div className="metric-card"><span>Video</span><strong>Tracked</strong><small>Play, 25/50/75/90, complete</small></div>
        <div className="funnel-card">
          {[
            ["Visit", 100],
            ["CTA", 74],
            ["Sample audit", 58],
            ["Form start", 42],
            ["Lead", 25]
          ].map(([stage, width]) => (
            <span style={{ width: `${width}%` }} key={stage}>{stage}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection({
  selectedPlan,
  setSelectedPlan
}: {
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
}) {
  return (
    <section className="pricing-section section-shell">
      <div className="section-heading">
        <h2>Simple, predictable pricing.</h2>
        <p>One-week pilots. Clear deliverables. No surprises.</p>
      </div>
      <PricingGrid selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
    </section>
  );
}

function PricingGrid({
  selectedPlan,
  setSelectedPlan
}: {
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
}) {
  return (
    <div className="pricing-grid">
      {pricing.map((plan) => (
        <button
          className={`price-card ${plan.featured ? "featured" : ""} ${selectedPlan === plan.title ? "selected" : ""}`}
          key={plan.title}
          type="button"
          aria-pressed={selectedPlan === plan.title}
          onClick={() => {
            setSelectedPlan(plan.title);
            trackEvent({ eventName: "pricing_selected", packageInterest: plan.title, ctaId: plan.title.toLowerCase().replaceAll(" ", "-") });
          }}
        >
          <span className="plan-title">{plan.title}</span>
          <span className="plan-price">{plan.price}</span>
          <span className="plan-note">{plan.note}</span>
          {plan.bullets.map((bullet) => (
            <span className="plan-bullet" key={bullet}>
              <Check size={15} />
              {bullet}
            </span>
          ))}
        </button>
      ))}
    </div>
  );
}

function FinalCta({
  selectedPlan,
  setSelectedPlan
}: {
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
}) {
  return (
    <section className="final-cta" id="book">
      <div className="booking-copy">
        <h2>Book the audit. Keep payment for later.</h2>
        <p>Tell us where the admin work is getting stuck. We will reply with next steps and scheduling options.</p>
        <TrackedLink href="mailto:hello@shipaxiom.com?subject=Private%20AI%20Workflow%20Audit" ctaId="mailto-final">
          hello@shipaxiom.com
        </TrackedLink>
      </div>
      <LeadForm selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
    </section>
  );
}

function ServicesPage() {
  return (
    <PageShell
      title="Services built around one measurable workflow."
      text="Start with a paid audit, ship one private AI workflow, then keep improving the system with analytics and human review."
    >
      <div className="service-grid">
        {pricing.map((plan) => (
          <a className="service-card" href={plan.href} key={plan.href}>
            <h2>{plan.title}</h2>
            <strong>{plan.price}</strong>
            <p>{plan.bullets.join(". ")}.</p>
            <span>Read more <ArrowRight size={14} /></span>
          </a>
        ))}
      </div>
    </PageShell>
  );
}

function ServiceDetailPage({
  route,
  selectedPlan,
  setSelectedPlan
}: {
  route: string;
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
}) {
  const service = pricing.find((plan) => plan.href === route) || pricing[0];
  return (
    <PageShell title={service.title} text={`${service.price} ${service.note}. ${service.bullets.join(". ")}.`}>
      <section className="detail-layout">
        <article>
          <h2>What you get</h2>
          <ul className="check-list">
            {service.bullets.map((bullet) => <li key={bullet}><Check size={16} /> {bullet}</li>)}
            <li><Check size={16} /> First-party analytics events wired into the funnel</li>
            <li><Check size={16} /> Clear privacy notes and sensitive-data boundaries</li>
          </ul>
        </article>
        <article>
          <h2>Good fit</h2>
          <p>Teams with repetitive admin work, sensitive client data boundaries, and a human reviewer who owns final approval.</p>
          <TrackedLink className="primary-action compact" href="/book-audit" ctaId={`service-${service.title}-book`}>
            Book this path
            <ArrowRight size={16} />
          </TrackedLink>
        </article>
      </section>
      <FinalCta selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
    </PageShell>
  );
}

function IndustryPage({ route }: { route: string }) {
  const industry = industryCards.find((item) => item.href === route) || industryCards[0];
  const Icon = industry.icon;
  return (
    <PageShell title={`${industry.title} workflows`} text={`Concrete AI workflow examples for ${industry.title.toLowerCase()}, with human approval and privacy boundaries built in.`}>
      <div className="industry-detail">
        <Icon size={34} />
        <h2>{industry.proof}</h2>
        <div className="service-grid">
          {industry.workflows.map((workflow) => (
            <article className="service-card" key={workflow}>
              <h3>{workflow}</h3>
              <p>Map the input, extract structured fields, flag exceptions, and route the final approval to staff.</p>
              <span>Human-reviewed output</span>
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function ProcessPage() {
  return (
    <PageShell title="A multi-review QA process for private AI delivery." text="One lead owns the plan. Six focused reviewers test independent risks. Results come back to the lead, fixes are made, and every reviewer is closed when complete.">
      <div className="process-grid expanded">
        {processSteps.map(({ title, text, icon: Icon }, index) => (
          <article className="process-step" key={title}>
            <div className="process-icon">
              <Icon size={22} />
              <span>{index + 1}</span>
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <section className="judge-panel">
        <div>
          <h2>Six judges, one lead.</h2>
          <p>Inspired by modern agent-team workflows: isolate context, parallelize independent questions, use specialized instructions, synthesize centrally, and clean up every worker after completion.</p>
        </div>
        <ol>
          {judgeLoop.map((judge) => <li key={judge}>{judge}</li>)}
        </ol>
      </section>
    </PageShell>
  );
}

function SecurityPage() {
  return (
    <PageShell title="Privacy-first AI, not data-hoarding AI." text="The workflow is designed around data minimization, scoped access, private deployment options, and human approval.">
      <div className="detail-layout">
        <article>
          <h2>Data boundaries</h2>
          <p>Forms ask for business context, not patient records, client files, case details, or regulated documents. Sensitive records are handled only inside a scoped engagement.</p>
        </article>
        <article>
          <h2>Deployment choices</h2>
          <p>Remote private workspace first; client-owned hardware or on-site appliances only when the use case requires it and the client funds it.</p>
        </article>
        <article>
          <h2>Analytics posture</h2>
          <p>First-party, cookieless analytics capture aggregate behavior only. We do not collect keystrokes, form values, full IP addresses, or full user agents for marketing analytics.</p>
        </article>
        <article>
          <h2>Admin access</h2>
          <p>Lead and analytics dashboards are behind an authenticated admin route with signed HttpOnly sessions. Admin reporting exposes aggregates first and keeps public analytics separate from submitted lead details.</p>
        </article>
      </div>
    </PageShell>
  );
}

function IndustriesPage() {
  return (
    <PageShell title="Industry playbooks for sensitive admin work." text="Choose the buyer path closest to your first workflow. Each path keeps the automation narrow, measurable, and human-reviewed.">
      <div className="industry-grid industry-index">
        {industryCards.map(({ title, href, icon: Icon, workflows, proof }) => (
          <a className="industry-card" href={href} key={href}>
            <Icon size={24} />
            <h3>{title}</h3>
            <p>{proof}</p>
            <ul>{workflows.map((workflow) => <li key={workflow}>{workflow}</li>)}</ul>
          </a>
        ))}
      </div>
    </PageShell>
  );
}

function PricingPage({ selectedPlan, setSelectedPlan }: { selectedPlan: string; setSelectedPlan: (plan: string) => void }) {
  return (
    <PageShell title="Pricing that keeps the pilot fundable." text="Start small, prove the workflow, then expand only when the results justify it.">
      <PricingGrid selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
      <FinalCta selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
    </PageShell>
  );
}

function CaseStudiesPage() {
  return (
    <PageShell title="Example engagements, measured like real work." text="These are anonymized sample patterns showing the kind of before/after a buyer should expect to inspect.">
      <div className="case-grid">
        {[
          ["Clinic intake review", "45 min manual packet review", "6 min AI-assisted review with staff approval", "39 min saved per packet"],
          ["Contract intake summary", "Long email threads and PDFs", "Structured matter summary and missing-info list", "Cleaner first response"],
          ["Monthly service report", "Owner compiles notes manually", "Draft report with exceptions and human edits", "2.5 hr/mo saved"]
        ].map(([title, before, after, result]) => (
          <article className="case-card" key={title}>
            <h2>{title}</h2>
            <span>Before: {before}</span>
            <span>After: {after}</span>
            <strong>{result}</strong>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function SampleAuditPage() {
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    trackEvent({ eventName: "sample_audit_view" });
  }, []);

  return (
    <PageShell title="Sample workflow audit" text="A concrete example of what the audit produces: scored opportunities, privacy boundaries, measurement points, and approval steps.">
      <section className="audit-report">
        <div className="report-header">
          <div>
            <h2>ACME Family Clinic intake workflow</h2>
            <p>Goal: reduce repetitive packet review while preserving staff approval and privacy boundaries.</p>
          </div>
          <button
            className="primary-action compact"
            type="button"
            onClick={() => {
              setGenerated(true);
              trackEvent({ eventName: "sample_audit_generate", ctaId: "sample-audit-generate" });
            }}
          >
            <Sparkles size={17} />
            Generate audit view
          </button>
        </div>
        <div className="audit-table">
          {sampleAuditRows.map((row) => (
            <article className={generated ? "generated" : ""} key={row.source}>
              <strong>{row.source}</strong>
              <span>{row.output}</span>
              <em>{row.score}/100</em>
              <small>{row.saved} saved · {row.risk} risk</small>
            </article>
          ))}
        </div>
        <div className="detail-layout">
          <article>
            <h2>Privacy boundary</h2>
            <p>No patient records in public forms. Pilot data is scoped to the client workspace. Staff verifies every extracted field before use.</p>
          </article>
          <article>
            <h2>Measurement plan</h2>
            <p>Track time per packet, exception rate, staff correction rate, and approval completion. Marketing analytics remain separate from client workflow data.</p>
          </article>
        </div>
      </section>
    </PageShell>
  );
}

function AnalyticsPage() {
  return (
    <PageShell title="First-party analytics for optimization." text="Ship Axiom now tracks the funnel without turning the site into a surveillance machine.">
      <AnalyticsPreview />
      <section className="detail-layout">
        <article>
          <h2>Tracked events</h2>
          <p>Page views, CTA clicks, pricing selections, sample audit views, form starts, form submissions, mailto clicks, and video milestones.</p>
        </article>
        <article>
          <h2>Not tracked</h2>
          <p>No keystrokes, no form field values, no full IP addresses, no full user agents, and no cross-site ad tracking cookies.</p>
        </article>
      </section>
    </PageShell>
  );
}

function BookAuditPage({ selectedPlan, setSelectedPlan }: { selectedPlan: string; setSelectedPlan: (plan: string) => void }) {
  return (
    <PageShell title="Book a workflow fit call." text="A short intake tells us which workflow is worth auditing first. Do not include patient, client, case, or other sensitive records in this form.">
      <FinalCta selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
    </PageShell>
  );
}

function AboutPage() {
  return (
    <PageShell title="Built for practical private AI delivery." text="Ship Axiom exists to make AI workflows inspectable, measurable, and safe enough for service businesses with sensitive admin work.">
      <div className="detail-layout">
        <article>
          <h2>Point of view</h2>
          <p>AI should remove repetitive admin drag, not create a mysterious black box. The first workflow must be narrow, reviewable, and tied to business metrics.</p>
        </article>
        <article>
          <h2>Operating model</h2>
          <p>We use a lead-orchestrated, multi-review workflow for research, implementation, and QA, then expose the measurable result in the admin dashboard.</p>
        </article>
      </div>
    </PageShell>
  );
}

function PrivacyPage() {
  return (
    <PolicyPage title="Privacy Policy">
      <p>Last updated: June 15, 2026. This policy explains how Ship Axiom collects, uses, and protects information submitted through this website.</p>
      <h2>Information we collect</h2>
      <p>Lead forms collect contact details, company details, business-level workflow context, budget range, package interest, and scheduling preferences. Do not submit patient records, client files, legal case details, tax documents, credentials, or other sensitive records through public forms.</p>
      <h2>Analytics</h2>
      <p>We use first-party, cookieless analytics to understand aggregate page views, CTA clicks, pricing selections, form funnel events, and video milestones. Analytics do not collect keystrokes, form field values, full IP addresses, or full user agents. A temporary sessionStorage flow ID is used only to group same-session website events.</p>
      <h2>Service providers</h2>
      <p>The website is hosted on Cloudflare Workers with Cloudflare D1 used for lead and analytics storage. Cloudflare may process technical security, routing, and abuse-prevention signals needed to serve and protect the site.</p>
      <h2>How we use information</h2>
      <p>We use submitted information to respond to requests, scope audits, improve the website, measure conversion, prevent abuse, and operate the service.</p>
      <h2>Retention and sharing</h2>
      <p>Analytics events are kept for website optimization and are scheduled for deletion after they age out of the operating window. Lead requests are kept only as long as reasonably needed for sales, operations, legal, and security purposes. We do not sell personal information or share it for cross-context behavioral advertising.</p>
      <h2>Your choices</h2>
      <p>Email hello@shipaxiom.com to request access, correction, or deletion of information you submitted.</p>
    </PolicyPage>
  );
}

function TermsPage() {
  return (
    <PolicyPage title="Terms">
      <p>These terms govern use of the Ship Axiom website. Website content is informational and does not create a consulting engagement until a separate agreement is signed.</p>
      <h2>No sensitive submissions</h2>
      <p>Do not submit patient records, legal documents, tax files, client secrets, passwords, or regulated records through public website forms.</p>
      <h2>Engagements</h2>
      <p>Paid audits, pilots, implementation work, and support are governed by written statements of work or service agreements.</p>
      <h2>Website availability</h2>
      <p>The website and demo materials are provided as-is for evaluation. Ship Axiom may update pages, analytics, pricing, and service descriptions as the offer changes.</p>
    </PolicyPage>
  );
}

function CookiePolicyPage() {
  return (
    <PolicyPage title="Cookie Policy">
      <p>Ship Axiom does not currently use third-party advertising cookies. The admin area uses a strictly necessary HttpOnly, Secure, SameSite session cookie named <code>shipaxiom_admin</code> after login.</p>
      <h2>Analytics</h2>
      <p>Marketing analytics are first-party and cookieless. Events are stored in aggregate-focused form to help optimize the website, booking funnel, and demo video. The public site may also use browser sessionStorage to keep a temporary flow ID for same-session measurement.</p>
      <h2>Security cookies</h2>
      <p>Cloudflare may use strictly necessary security mechanisms to route traffic, mitigate abuse, and protect the site.</p>
    </PolicyPage>
  );
}

function PolicyPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PageShell title={title} text="Plain-language operating policy for a privacy-first AI workflow service.">
      <article className="policy-copy">{children}</article>
    </PageShell>
  );
}

function PageShell({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  const path = typeof window === "undefined" ? "/" : window.location.pathname.replace(/\/$/, "") || "/";
  const showSample = path !== "/sample-audit" && path !== "/book-audit";
  const showBook = path !== "/book-audit";

  return (
    <>
      <section className="page-hero section-shell">
        <h1>{title}</h1>
        <p>{text}</p>
        {(showBook || showSample) && (
          <div className="hero-actions">
            {showBook && (
              <TrackedLink className="primary-action" href="/book-audit" ctaId={`page-book-${slug(title)}`}>
                Book fit call
                <ArrowRight size={17} />
              </TrackedLink>
            )}
            {showSample && (
              <TrackedLink className="secondary-action" href="/sample-audit" ctaId={`page-sample-${slug(title)}`}>
                View sample audit
                <ChevronRight size={17} />
              </TrackedLink>
            )}
          </div>
        )}
      </section>
      {children}
    </>
  );
}

function StackRow({
  active,
  onClick,
  label,
  model,
  use,
  quant
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  model: string;
  use: string;
  quant: string;
}) {
  return (
    <button className={`stack-row ${active ? "active" : ""}`} type="button" aria-pressed={active} onClick={onClick}>
      <span>
        <strong>{model}</strong>
        <em>{label}</em>
      </span>
      <span>{use}</span>
      <span>{quant}</span>
      <span className="apple-pill">{label === "Default" ? "Yes" : label}</span>
    </button>
  );
}

function LeadForm({
  selectedPlan,
  setSelectedPlan
}: {
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    industry: "",
    teamSize: "",
    budget: "",
    preferredTime: "",
    workflow: "",
    privacyNeeds: "",
    website: ""
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  function updateField(field: keyof typeof form, value: string) {
    if (!started.current && field !== "website") {
      started.current = true;
      trackEvent({ eventName: "form_start", formStep: field, packageInterest: selectedPlan });
    }
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    trackEvent({ eventName: "form_submit_attempt", packageInterest: selectedPlan });

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, packageInterest: selectedPlan })
      });
      const result = (await response.json()) as { ok: boolean; id?: number; error?: string };

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.error || "Something went wrong. Email hello@shipaxiom.com if this keeps happening.");
        trackEvent({ eventName: "form_submit_error", formStep: result.error || "unknown", packageInterest: selectedPlan });
        return;
      }

      setStatus("success");
      setMessage(`Request received${result.id ? ` #${result.id}` : ""}. We will reply with next steps and scheduling options.`);
      trackEvent({ eventName: "form_submit_success", packageInterest: selectedPlan });
      setForm({
        name: "",
        email: "",
        company: "",
        phone: "",
        industry: "",
        teamSize: "",
        budget: "",
        preferredTime: "",
        workflow: "",
        privacyNeeds: "",
        website: ""
      });
      started.current = false;
    } catch {
      setStatus("error");
      setMessage("Could not send the request. Email hello@shipaxiom.com if this keeps happening.");
      trackEvent({ eventName: "form_submit_error", formStep: "network", packageInterest: selectedPlan });
    }
  }

  return (
    <form className="lead-form" method="post" action="/api/leads" onSubmit={submitLead}>
      <label className="hidden-field">
        Website
        <input name="website" value={form.website} onChange={(event) => updateField("website", event.target.value)} tabIndex={-1} autoComplete="off" />
      </label>
      <div className="form-grid">
        <label>Name<input required name="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} autoComplete="name" /></label>
        <label>Work email<input required name="email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} autoComplete="email" /></label>
        <label>Company<input required name="company" value={form.company} onChange={(event) => updateField("company", event.target.value)} autoComplete="organization" /></label>
        <label>Phone<input name="phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} autoComplete="tel" /></label>
        <label>
          Industry
          <select required name="industry" value={form.industry} onChange={(event) => updateField("industry", event.target.value)}>
            <option value="">Select</option>
            <option>Clinic or healthcare admin</option>
            <option>Law firm</option>
            <option>Accounting or tax</option>
            <option>Home services</option>
            <option>B2B services</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          Team size
          <select required name="teamSize" value={form.teamSize} onChange={(event) => updateField("teamSize", event.target.value)}>
            <option value="">Select</option>
            <option>1-5</option>
            <option>6-15</option>
            <option>16-50</option>
            <option>51+</option>
          </select>
        </label>
        <label>
          Budget range
          <select required name="budget" value={form.budget} onChange={(event) => updateField("budget", event.target.value)}>
            <option value="">Select</option>
            <option>$2,500 audit first</option>
            <option>$9,500 sprint ready</option>
            <option>$15,000+ regulated pilot</option>
            <option>Need guidance</option>
          </select>
        </label>
        <label>
          Package interest
          <select required name="packageInterest" value={selectedPlan} onChange={(event) => setSelectedPlan(event.target.value)}>
            {pricing.map((plan) => <option key={plan.title}>{plan.title}</option>)}
          </select>
        </label>
      </div>
      <p className="field-warning">Use business-level workflow descriptions only. Do not paste patient, client, case, tax, credential, or record-level details.</p>
      <label>
        Workflow to fix first
        <textarea required name="workflow" value={form.workflow} onChange={(event) => updateField("workflow", event.target.value)} placeholder="Example: intake forms, insurance verification, monthly reports, contracts, follow-up emails..." />
      </label>
      <label>
        Privacy or deployment needs
        <textarea name="privacyNeeds" value={form.privacyNeeds} onChange={(event) => updateField("privacyNeeds", event.target.value)} placeholder="Do not include patient, client, case, or other sensitive records in this public form." />
      </label>
      <label>
        Best times for a 30-minute call
        <input name="preferredTime" value={form.preferredTime} onChange={(event) => updateField("preferredTime", event.target.value)} placeholder="Example: Tue or Thu after 2pm PT" />
      </label>
      <p className="form-disclosure">
        Do not submit patient records, client files, case facts, tax documents, credentials, or regulated data. See the <a href="/privacy">Privacy Policy</a>.
      </p>
      <button className="blue-action" disabled={status === "submitting"} type="submit">
        {status === "submitting" ? <CalendarDays size={19} /> : <Send size={19} />}
        {status === "submitting" ? "Sending request" : "Request audit call"}
      </button>
      {message && <p className={`form-message ${status}`}>{message}</p>}
    </form>
  );
}

function AuditCockpit({
  stack,
  setStack,
  stackInfo
}: {
  stack: StackKey;
  setStack: (key: StackKey) => void;
  stackInfo: { title: string; sub: string; detail: string; stat: string };
}) {
  return (
    <div className="cockpit" aria-label="Audit cockpit demo">
      <div className="cockpit-top">
        <strong>Audit cockpit</strong>
        <span><ShieldCheck size={14} /> First-party analytics on</span>
        <TrackedLink href="/sample-audit" ctaId="cockpit-open-sample">Open sample <ArrowRight size={14} /></TrackedLink>
      </div>
      <div className="cockpit-grid">
        <article className="summary-card">
          <h3>Workflow audit</h3>
          {["Business type: private medical clinic", "Opportunity: intake packet review", "Data sensitivity: high", "Human review: required"].map((line) => (
            <p key={line}><Check size={15} /> {line}</p>
          ))}
          <strong><LockKeyhole size={15} /> No public PHI capture</strong>
        </article>
        <article className="draft-card visible">
          <h3>Measured funnel</h3>
          {["Page view", "CTA click", "Sample audit", "Form start", "Lead submit"].map((line) => (
            <p key={line}><MousePointerClick size={14} /> {line}<em className="high">Tracked</em></p>
          ))}
        </article>
        <article className="stack-card">
          <h3>Delivery stack</h3>
          {(Object.keys(stackCards) as StackKey[]).map((key) => (
            <button
              key={key}
              className={stack === key ? "selected-model" : ""}
              type="button"
              aria-pressed={stack === key}
              onClick={() => setStack(key)}
            >
              <span>{stackCards[key].sub}</span>
              <strong>{stackCards[key].title}</strong>
            </button>
          ))}
        </article>
      </div>
      <div className="active-model">
        <DatabaseZap size={18} />
        <span>{stackInfo.title}</span>
        <em>{stackInfo.stat}</em>
      </div>
    </div>
  );
}

function AdminApp() {
  const [session, setSession] = useState<"checking" | "authenticated" | "anonymous">("checking");
  const [adminUser, setAdminUser] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginMessage, setLoginMessage] = useState("");
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [adminView, setAdminView] = useState<"analytics" | "leads">("analytics");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    void checkSession();
  }, []);

  useEffect(() => {
    if (session === "authenticated") {
      void loadAdminData();
    }
  }, [session]);

  useEffect(() => {
    if (!leads.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !leads.some((lead) => lead.id === selectedId)) {
      setSelectedId(leads[0].id);
    }
  }, [leads, selectedId]);

  const filteredLeads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesSearch =
        !needle ||
        [lead.name, lead.email, lead.company, lead.industry, lead.workflow, lead.package_interest]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [leads, query, statusFilter]);

  const leadMetrics = useMemo(
    () => ({
      total: leads.length,
      new: leads.filter((lead) => lead.status === "new").length,
      active: leads.filter((lead) => ["contacted", "qualified", "booked"].includes(lead.status)).length,
      won: leads.filter((lead) => lead.status === "won").length
    }),
    [leads]
  );

  const selectedLead = filteredLeads.find((lead) => lead.id === selectedId) || filteredLeads[0] || null;

  async function checkSession() {
    try {
      const response = await fetch("/api/admin/session", { credentials: "include" });
      const result = (await response.json()) as { ok: boolean; user?: string };
      if (response.ok && result.ok) {
        setAdminUser(result.user || "");
        setSession("authenticated");
        return;
      }
    } catch {
      setAdminError("Could not check the admin session.");
    }
    setSession("anonymous");
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginMessage("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const result = (await response.json()) as { ok: boolean; user?: string; error?: string };
      if (!response.ok || !result.ok) {
        setLoginMessage(result.error || "Invalid username or password.");
        return;
      }
      setAdminUser(result.user || loginForm.username);
      setLoginForm((current) => ({ ...current, password: "" }));
      setSession("authenticated");
    } catch {
      setLoginMessage("Could not sign in. Try again in a moment.");
    }
  }

  async function loadAdminData() {
    setLoading(true);
    setAdminError("");
    const errors: string[] = [];

    try {
      const leadsResponse = await fetch("/api/admin/leads", { credentials: "include" });
      if (leadsResponse.status === 401) {
        setSession("anonymous");
        setLeads([]);
        setAnalytics(null);
        return;
      }

      const leadsResult = (await leadsResponse.json()) as { ok: boolean; leads?: AdminLead[]; error?: string };
      if (!leadsResponse.ok || !leadsResult.ok) {
        errors.push(leadsResult.error || "Could not load booking requests.");
      } else {
        setLeads((leadsResult.leads || []).map((lead) => ({ ...lead, status: lead.status || "new" })));
      }

      const analyticsResponse = await fetch("/api/admin/analytics?days=30", { credentials: "include" });
      if (analyticsResponse.status === 401) {
        setSession("anonymous");
        setLeads([]);
        setAnalytics(null);
        return;
      }

      const analyticsResult = (await analyticsResponse.json()) as ({ ok: true } & AnalyticsSummary) | { ok: false; error?: string };
      if (!analyticsResponse.ok || !analyticsResult.ok) {
        errors.push(("error" in analyticsResult && analyticsResult.error) || "Could not load analytics.");
      } else {
        setAnalytics(analyticsResult);
      }

      if (errors.length) {
        setAdminError(errors.join(" "));
      }
    } catch {
      setAdminError("Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function updateLeadStatus(id: number, status: LeadStatus) {
    setUpdatingId(id);
    setAdminError("");
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status })
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setAdminError(result.error || "Could not update the lead.");
        return;
      }
      setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
    } catch {
      setAdminError("Could not update the lead.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" }).catch(() => null);
    setSession("anonymous");
    setLeads([]);
    setAnalytics(null);
    setAdminUser("");
  }

  if (session === "checking") {
    return <AdminLoginShell title="Checking session" icon={RefreshCw} />;
  }

  if (session === "anonymous") {
    return (
      <main className="admin-page admin-login">
        <section className="admin-login-card">
          <a className="brand small" href="/"><span className="brand-mark"><span /></span><span>Ship Axiom</span></a>
          <div className="admin-login-icon"><KeyRound size={24} /></div>
          <h1>Admin access</h1>
          <p>View booking requests, contact details, funnel analytics, video engagement, and recent conversion events.</p>
          <form className="admin-login-form" onSubmit={submitLogin}>
            <label>Username<input required autoComplete="username" value={loginForm.username} onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))} /></label>
            <label>Password<input required type="password" autoComplete="current-password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} /></label>
            <button className="admin-button dark" type="submit"><KeyRound size={17} /> Sign in</button>
            {loginMessage && <p className="admin-error">{loginMessage}</p>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="brand small" href="/"><span className="brand-mark"><span /></span><span>Ship Axiom</span></a>
        <div className="admin-title"><span>Admin</span><strong>{adminView === "analytics" ? "Analytics dashboard" : "Bookings pipeline"}</strong></div>
        <div className="admin-actions">
          <span className="admin-user">{adminUser}</span>
          <button className="admin-button" type="button" onClick={() => setAdminView(adminView === "analytics" ? "leads" : "analytics")}>
            {adminView === "analytics" ? <Inbox size={16} /> : <LineChart size={16} />}
            {adminView === "analytics" ? "Leads" : "Analytics"}
          </button>
          <button className="admin-button" type="button" onClick={() => void loadAdminData()} disabled={loading}><RefreshCw size={16} /> Refresh</button>
          <button className="admin-button" type="button" onClick={() => void logout()}><LogOut size={16} /> Log out</button>
        </div>
      </header>

      {adminError && <p className="admin-error wide">{adminError}</p>}
      {adminView === "analytics" ? (
        <AdminAnalytics analytics={analytics} loading={loading} leadMetrics={leadMetrics} />
      ) : (
        <AdminLeads
          leads={filteredLeads}
          selectedLead={selectedLead}
          leadMetrics={leadMetrics}
          loading={loading}
          query={query}
          setQuery={setQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          setSelectedId={setSelectedId}
          updatingId={updatingId}
          updateLeadStatus={updateLeadStatus}
        />
      )}
    </main>
  );
}

function AdminLoginShell({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <main className="admin-page admin-login">
      <section className="admin-login-card">
        <a className="brand small" href="/"><span className="brand-mark"><span /></span><span>Ship Axiom</span></a>
        <div className="admin-login-icon"><Icon size={24} /></div>
        <h1>{title}</h1>
      </section>
    </main>
  );
}

function AdminAnalytics({ analytics, loading, leadMetrics }: { analytics: AnalyticsSummary | null; loading: boolean; leadMetrics: { total: number; new: number; active: number; won: number } }) {
  const totals = analytics?.totals;
  const funnelMax = Math.max(1, ...(analytics?.funnel || []).map((item) => item.total));
  const videoMax = Math.max(1, ...(analytics?.video || []).map((item) => item.total));
  const metricCards = [
    ["Page views", totals?.pageViews ?? 0, "Last 30 days"],
    ["CTA clicks", totals?.ctaClicks ?? 0, "Tracked buttons"],
    ["Form starts", totals?.formStarts ?? 0, "Intent signal"],
    ["Submitted leads", totals?.formSubmits ?? leadMetrics.total, "Public form success"],
    ["Conversion rate", `${totals?.conversionRate ?? 0}%`, "Submit / page view"],
    ["Video events", totals?.videoEvents ?? 0, "Play and milestones"],
    ["Pricing picks", totals?.pricingSelections ?? 0, "Plan intent"],
    ["Submit errors", totals?.formErrors ?? 0, "Friction signal"]
  ];

  return (
    <>
      <section className="admin-metrics six" aria-label="Analytics metrics">
        {metricCards.map(([label, value, note]) => (
          <article className="admin-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </section>
      <section className="analytics-admin-grid">
        <article className="admin-panel">
          <h2>Funnel</h2>
          {(analytics?.funnel || []).map((item) => (
            <div className="bar-row" key={item.stage}>
              <span>{item.stage}</span>
              <strong>{item.total}</strong>
              <em style={{ width: `${Math.max(8, (item.total / funnelMax) * 100)}%` }} />
            </div>
          ))}
          {!analytics?.funnel?.length && <EmptyAdmin loading={loading} label="No funnel events yet" />}
        </article>
        <article className="admin-panel">
          <h2>Top pages</h2>
          {(analytics?.topPages || []).map((row) => (
            <div className="table-row" key={row.page_path}>
              <span>{row.page_path}</span>
              <strong>{row.views} views</strong>
            </div>
          ))}
          {!analytics?.topPages?.length && <EmptyAdmin loading={loading} label="No page views yet" />}
        </article>
        <article className="admin-panel">
          <h2>Top CTAs</h2>
          {(analytics?.topCtas || []).map((row) => (
            <div className="table-row" key={row.cta_id}>
              <span>{row.cta_id}</span>
              <strong>{row.clicks} clicks</strong>
            </div>
          ))}
          {!analytics?.topCtas?.length && <EmptyAdmin loading={loading} label="No CTA clicks yet" />}
        </article>
        <article className="admin-panel">
          <h2>Recent events</h2>
          {(analytics?.recentEvents || []).map((row, index) => {
            const videoMilestone = typeof row.video_milestone === "number" ? `video ${row.video_milestone}%` : "";
            const details = [
              row.page_path ? `path ${row.page_path}` : "",
              row.cta_id ? `cta ${row.cta_id}` : "",
              row.form_step ? `form ${row.form_step}` : "",
              row.package_interest ? `plan ${row.package_interest}` : "",
              videoMilestone,
              row.device_class ? String(row.device_class) : "",
              row.received_at ? formatDate(String(row.received_at)) : ""
            ].filter(Boolean).join(" · ");
            return (
              <div className="event-row" key={`${row.received_at}-${index}`}>
                <strong>{String(row.event_name || "")}</strong>
                <span>{details || "No event context"}</span>
              </div>
            );
          })}
          {!analytics?.recentEvents?.length && <EmptyAdmin loading={loading} label="No recent events yet" />}
        </article>
        <article className="admin-panel">
          <h2>Video milestones</h2>
          {(analytics?.video || []).map((row) => (
            <div className="bar-row" key={row.milestone}>
              <span>{row.milestone}%</span>
              <strong>{row.total}</strong>
              <em style={{ width: `${Math.max(8, (row.total / videoMax) * 100)}%` }} />
            </div>
          ))}
          {!analytics?.video?.length && <EmptyAdmin loading={loading} label="No video events yet" />}
        </article>
        <article className="admin-panel">
          <h2>Daily trend</h2>
          {(analytics?.daily || []).slice(-14).map((row) => (
            <div className="table-row" key={row.day}>
              <span>{row.day}</span>
              <strong>{row.page_views} views · {row.cta_clicks} clicks · {row.form_submits} leads</strong>
            </div>
          ))}
          {!analytics?.daily?.length && <EmptyAdmin loading={loading} label="No daily trend yet" />}
        </article>
      </section>
    </>
  );
}

function AdminLeads({
  leads,
  selectedLead,
  leadMetrics,
  loading,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  setSelectedId,
  updatingId,
  updateLeadStatus
}: {
  leads: AdminLead[];
  selectedLead: AdminLead | null;
  leadMetrics: { total: number; new: number; active: number; won: number };
  loading: boolean;
  query: string;
  setQuery: (query: string) => void;
  statusFilter: LeadStatus | "all";
  setStatusFilter: (status: LeadStatus | "all") => void;
  setSelectedId: (id: number) => void;
  updatingId: number | null;
  updateLeadStatus: (id: number, status: LeadStatus) => Promise<void>;
}) {
  return (
    <>
      <section className="admin-metrics" aria-label="Booking metrics">
        <AdminMetric label="Total requests" value={leadMetrics.total} note="Latest 100 leads" />
        <AdminMetric label="New" value={leadMetrics.new} note="Needs first touch" />
        <AdminMetric label="Active" value={leadMetrics.active} note="Contacted, qualified, booked" />
        <AdminMetric label="Won" value={leadMetrics.won} note="Closed pipeline" />
      </section>
      <section className="admin-toolbar" aria-label="Lead filters">
        <label className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads" /></label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "all")}>
            <option value="all">All statuses</option>
            {leadStatuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
          </select>
        </label>
        <span>{leads.length} shown</span>
      </section>
      <section className="admin-grid">
        <div className="lead-list" aria-label="Booking requests">
          {loading ? <EmptyAdmin loading label="Loading requests" /> : leads.length ? leads.map((lead) => (
            <button className={`lead-row ${selectedLead?.id === lead.id ? "active" : ""}`} key={lead.id} type="button" onClick={() => setSelectedId(lead.id)}>
              <span className="lead-row-top"><strong>{lead.company}</strong><em className={`status-chip ${lead.status}`}>{statusLabels[lead.status]}</em></span>
              <span>{lead.name} · {lead.email}</span>
              <small>{lead.package_interest} · {formatDate(lead.created_at)}</small>
            </button>
          )) : <EmptyAdmin label="No booking requests found" />}
        </div>
        <aside className="lead-detail" aria-label="Selected booking request">
          {selectedLead ? (
            <>
              <div className="detail-header">
                <div><span>Lead #{selectedLead.id}</span><h1>{selectedLead.company}</h1><p>{formatDate(selectedLead.created_at)}</p></div>
                <label>
                  Status
                  <select value={selectedLead.status} disabled={updatingId === selectedLead.id} onChange={(event) => void updateLeadStatus(selectedLead.id, event.target.value as LeadStatus)}>
                    {leadStatuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
                  </select>
                </label>
              </div>
              <div className="detail-actions">
                <a href={`mailto:${selectedLead.email}`}><Mail size={16} /> Email</a>
                {selectedLead.phone && <a href={`tel:${selectedLead.phone.replace(/[^\d+]/g, "")}`}><Phone size={16} /> Call</a>}
              </div>
              <div className="detail-grid">
                <DetailItem icon={Mail} label="Contact" value={`${selectedLead.name} · ${selectedLead.email}`} />
                <DetailItem icon={Phone} label="Phone" value={selectedLead.phone || "Not provided"} />
                <DetailItem icon={Building2} label="Industry" value={selectedLead.industry} />
                <DetailItem icon={UserCheck} label="Team size" value={selectedLead.team_size} />
                <DetailItem icon={Target} label="Budget" value={selectedLead.budget} />
                <DetailItem icon={CalendarDays} label="Best time" value={selectedLead.preferred_time || "Not provided"} />
              </div>
              <section className="detail-block"><span>Package</span><p>{selectedLead.package_interest}</p></section>
              <section className="detail-block"><span>Workflow to fix first</span><p>{selectedLead.workflow}</p></section>
              <section className="detail-block"><span>Privacy or deployment needs</span><p>{selectedLead.privacy_needs || "Not provided"}</p></section>
            </>
          ) : <EmptyAdmin label="Select a request" />}
        </aside>
      </section>
    </>
  );
}

function AdminMetric({ label, value, note }: { label: string; value: number; note: string }) {
  return <article className="admin-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function EmptyAdmin({ loading, label }: { loading?: boolean; label: string }) {
  return <div className="empty-admin">{loading ? <RefreshCw size={22} /> : <Inbox size={24} />}<strong>{label}</strong></div>;
}

function DetailItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="detail-item"><Icon size={17} /><span>{label}</span><strong>{value}</strong></div>;
}

function TrackedLink({
  href,
  ctaId,
  sectionId,
  className,
  children
}: {
  href: string;
  ctaId: string;
  sectionId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className={className}
      href={href}
      onClick={() => {
        if (href.startsWith("mailto:")) {
          trackEvent({ eventName: "mailto_click", ctaId, sectionId });
          return;
        }
        if (href.startsWith("tel:")) {
          trackEvent({ eventName: "phone_click", ctaId, sectionId });
          return;
        }
        trackEvent({ eventName: "cta_click", ctaId, sectionId });
      }}
    >
      {children}
    </a>
  );
}

function trackEvent(payload: TrackPayload) {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) {
    return;
  }

  const search = new URLSearchParams(window.location.search);
  const body = JSON.stringify({
    eventId: crypto.randomUUID(),
    eventName: payload.eventName,
    pagePath: window.location.pathname,
    sectionId: payload.sectionId,
    ctaId: payload.ctaId,
    formStep: payload.formStep,
    packageInterest: payload.packageInterest,
    videoId: payload.videoId,
    videoMilestone: payload.videoMilestone,
    referrerHost: safeHost(document.referrer),
    utmSource: search.get("utm_source") || undefined,
    utmMedium: search.get("utm_medium") || undefined,
    utmCampaign: search.get("utm_campaign") || undefined,
    deviceClass: window.innerWidth < 760 ? "mobile" : window.innerWidth < 1120 ? "tablet" : "desktop",
    browserFamily: browserFamily(),
    flowId: flowId()
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/event", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true
  }).catch(() => null);
}

function safeHost(value: string) {
  try {
    return value ? new URL(value).hostname.slice(0, 120) : undefined;
  } catch {
    return undefined;
  }
}

function browserFamily() {
  const agent = navigator.userAgent;
  if (agent.includes("Firefox")) return "Firefox";
  if (agent.includes("Edg")) return "Edge";
  if (agent.includes("Safari") && !agent.includes("Chrome")) return "Safari";
  if (agent.includes("Chrome")) return "Chrome";
  return "Other";
}

function flowId() {
  const key = "shipaxiom_flow_id";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.sessionStorage.setItem(key, next);
  return next;
}

function normalizeRoute(pathname: string) {
  if (pathname === "/admin") return "/admin";
  const cleanPath = pathname.replace(/\/$/, "") || "/";
  const known = new Set<string>([
    "/",
    "/services",
    "/services/ai-workflow-audit",
    "/services/ship-sprint",
    "/services/ops-care",
    "/industries",
    "/industries/healthcare-admin",
    "/industries/law-firms",
    "/industries/accounting-tax",
    "/industries/b2b-services",
    "/process",
    "/security",
    "/pricing",
    "/case-studies",
    "/sample-audit",
    "/analytics",
    "/book-audit",
    "/about",
    "/privacy",
    "/terms",
    "/cookie-policy"
  ]);
  return known.has(cleanPath) ? (cleanPath as SiteRoute) : "/";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
