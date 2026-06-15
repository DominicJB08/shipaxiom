import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Code2,
  DatabaseZap,
  ExternalLink,
  FileSearch,
  LockKeyhole,
  Map,
  MousePointerClick,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./styles.css";

type StackKey = "daily" | "fallback" | "specialist";
type Impact = "High impact" | "Medium impact";

type WorkflowStep = {
  title: string;
  text: string;
  icon: LucideIcon;
};

type AuditItem = {
  source: string;
  output: string;
  impact: Impact;
};

const workflowSteps: WorkflowStep[] = [
  { title: "Map", text: "We map your repetitive work, systems, and data boundaries.", icon: FileSearch },
  { title: "Find the wedge", text: "We identify the highest-impact, lowest-risk automation.", icon: Target },
  { title: "Design", text: "We design prompts, guardrails, and review steps.", icon: Code2 },
  { title: "Build local", text: "We build and test locally using the right model.", icon: Bot },
  { title: "Validate", text: "You review outputs before anything ships.", icon: ShieldCheck },
  { title: "Ship", text: "We deploy on your Mac or private server.", icon: Rocket },
  { title: "Handover", text: "We document and train your team.", icon: UserCheck }
];

const auditItems: AuditItem[] = [
  { source: "Intake form", output: "structured data", impact: "High impact" },
  { source: "Prior auth packet", output: "draft", impact: "High impact" },
  { source: "Insurance verification", output: "assistant", impact: "High impact" },
  { source: "Follow-up reminders", output: "automation", impact: "Medium impact" },
  { source: "Monthly clinic report", output: "draft", impact: "Medium impact" }
];

const stackCards: Record<StackKey, { title: string; sub: string; detail: string; stat: string }> = {
  daily: {
    title: "Qwen3.6-35B-A3B MLX",
    sub: "4-bit daily driver",
    detail: "Fast extraction, summaries, classification, audit drafts, and routine code work on Apple Silicon.",
    stat: "3B active params"
  },
  fallback: {
    title: "Qwen3.6 higher-bit",
    sub: "6-bit or 8-bit fallback",
    detail: "Reserved for harder planning, complex reasoning, and coding tasks where accuracy matters more than speed.",
    stat: "262K context"
  },
  specialist: {
    title: "GLM-4.5-Air MLX",
    sub: "Tool-loop specialist",
    detail: "Kept for strict agentic coding flows where reliable tool use matters more than being the universal default.",
    stat: "128K context"
  }
};

const pricing = [
  {
    title: "Private AI Ops Audit",
    price: "$299",
    note: "One-time",
    bullets: ["Workflow and system map", "Top opportunities and risk", "Privacy boundary review", "7-day pilot recommendation"]
  },
  {
    title: "7-Day Pilot",
    price: "$2,500",
    note: "Fixed scope",
    featured: true,
    bullets: ["Everything in the audit", "Build and test one workflow", "Local deployment", "Team handover docs"]
  },
  {
    title: "Ongoing Support",
    price: "$750",
    note: "Per month",
    bullets: ["Workflow improvements", "New automations", "Monitoring and guardrails", "Priority support"]
  }
];

function App() {
  const [stack, setStack] = useState<StackKey>("daily");
  const [auditGenerated, setAuditGenerated] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("7-Day Pilot");
  const [checks, setChecks] = useState([true, true, false]);

  const stackInfo = stackCards[stack];
  const completedChecks = useMemo(() => checks.filter(Boolean).length, [checks]);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Ship Axiom home">
          <span className="brand-mark">
            <span />
          </span>
          <span>Ship Axiom</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#workflows">Workflows</a>
          <a href="#stack">Model Stack</a>
          <a href="#demo">Demo</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <a className="header-cta" href="#book">
          Book audit
          <ArrowRight size={16} strokeWidth={2.4} />
        </a>
      </header>

      <section id="top" className="hero section-shell">
        <div className="hero-copy">
          <h1>Private AI workflows that run close to the work.</h1>
          <p>
            Ship Axiom maps repetitive admin, proves the safest local-AI wedge, and ships a
            7-day pilot without sending sensitive context to cloud LLMs.
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => setAuditGenerated(true)}>
              <Sparkles size={18} />
              Generate an audit
            </button>
            <a className="secondary-action" href="#stack">
              See model stack
              <ChevronRight size={17} />
            </a>
          </div>
          <div className="trust-row" aria-label="Key promises">
            <TrustItem icon={LockKeyhole} title="Privacy-first by default" text="Data stays on your device or network." />
            <TrustItem icon={ShieldCheck} title="Human in the loop" text="Every output reviewed before it ships." />
            <TrustItem icon={Zap} title="7 days to value" text="Audit, build, and ship in one focused week." />
          </div>
        </div>
        <AuditCockpit auditGenerated={auditGenerated} stack={stack} setStack={setStack} stackInfo={stackInfo} />
      </section>

      <section id="workflows" className="process-section">
        <div className="section-heading centered">
          <h2>Our 7-day private AI ops process</h2>
        </div>
        <div className="process-grid">
          {workflowSteps.map(({ title, text, icon: Icon }, index) => (
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
      </section>

      <section id="stack" className="model-section section-shell">
        <div className="section-heading model-heading">
          <h2>Local model stack. Right model. Right job.</h2>
          <p>
            We run a local-first stack on Apple Silicon. Use the efficient 4-bit model
            for everyday work, then escalate only when deeper reasoning is useful.
          </p>
          <a href="#demo">Explore the model stack <ArrowRight size={15} /></a>
        </div>
        <div className="stack-table" role="table" aria-label="Local model stack comparison">
          <div className="stack-row stack-head" role="row">
            <span>Model</span>
            <span>Use for</span>
            <span>Quantization</span>
            <span>Runs on Apple Silicon</span>
          </div>
          <StackRow active={stack === "daily"} onClick={() => setStack("daily")} label="Daily driver" model="Qwen3.6-35B-A3B MLX" use="Drafting, extraction, classification, summarization, routine coding" quant="4-bit" />
          <StackRow active={stack === "fallback"} onClick={() => setStack("fallback")} label="Fallback" model="Qwen3.6-35B-A3B MLX" use="Hard planning, complex reasoning, higher-accuracy coding" quant="6-bit / 8-bit" />
          <StackRow active={stack === "specialist"} onClick={() => setStack("specialist")} label="Tool loops" model="GLM-4.5-Air MLX" use="Claude Code, Cline, OpenCLAW-style strict tool use" quant="4-bit / 6-bit" />
        </div>
      </section>

      <section id="demo" className="sample-section section-shell">
        <div className="section-heading">
          <h2>Sample audit output</h2>
          <p>You receive a clear plan with recommended workflows, data used, model choices, and human review steps.</p>
          <button className="text-button" onClick={() => setAuditGenerated(true)}>
            View a full sample audit <ArrowRight size={15} />
          </button>
        </div>
        <article className="opportunity-panel">
          <h3>Top opportunities</h3>
          {auditItems.map(({ source, output, impact }, index) => (
            <div className="opportunity-row" key={source}>
              <span>{index + 1}</span>
              <strong>{source}</strong>
              <ArrowRight size={14} />
              <span>{output}</span>
              <em className={impact.startsWith("High") ? "high" : "medium"}>{impact}</em>
            </div>
          ))}
        </article>
        <article className="workflow-panel">
          <h3>Workflow: intake form to structured data</h3>
          <p>
            Extract key fields from intake forms, summarize them for review, and keep the final
            approval step with staff before use.
          </p>
          <div className="mini-list">
            <span>Input: intake form PDF</span>
            <span>Model: {stackInfo.title}</span>
            <span>Review: verify extracted fields</span>
          </div>
        </article>
        <article className="review-panel">
          <h3>Human review checklist</h3>
          {["Accuracy", "Completeness", "Approve"].map((label, index) => (
            <label className="check-row" key={label}>
              <input
                type="checkbox"
                checked={checks[index]}
                onChange={() => setChecks((current) => current.map((item, i) => (i === index ? !item : item)))}
              />
              <span>{label}</span>
              <small>{index === 0 ? "Fields correct?" : index === 1 ? "Anything missing?" : "Ready for use?"}</small>
            </label>
          ))}
          <div className="review-status">{completedChecks}/3 review steps complete</div>
        </article>
      </section>

      <section className="image-band section-shell" aria-label="Local workstation preview">
        <img src="/images/local-ai-workstation.png" alt="Local AI workstation running a private audit cockpit" />
        <div>
          <h2>Built for the machines already in the room.</h2>
          <p>
            A strong Apple Silicon laptop can handle the first proof-of-value. Ship Axiom designs
            workflows around local inference, exportable artifacts, and explicit review gates.
          </p>
        </div>
      </section>

      <section id="pricing" className="pricing-section section-shell">
        <div className="section-heading">
          <h2>Simple, predictable pricing</h2>
          <p>One-week pilots. Clear deliverables. No surprises.</p>
        </div>
        <div className="pricing-grid">
          {pricing.map((plan) => (
            <button
              className={`price-card ${plan.featured ? "featured" : ""} ${selectedPlan === plan.title ? "selected" : ""}`}
              key={plan.title}
              onClick={() => setSelectedPlan(plan.title)}
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
      </section>

      <section id="book" className="final-cta">
        <div>
          <h2>Keep your data private. Ship AI that works.</h2>
          <p>Book a private audit and see the highest-impact workflow we can ship in 7 days locally.</p>
        </div>
        <a href="mailto:hello@shipaxiom.com?subject=Private%20AI%20Ops%20Audit" className="blue-action">
          <CalendarDays size={19} />
          Book your audit
        </a>
        <span>No commitment. 30-minute call.</span>
      </section>

      <footer className="site-footer">
        <a className="brand small" href="#top">
          <span className="brand-mark"><span /></span>
          <span>Ship Axiom</span>
        </a>
        <span>© 2026 Ship Axiom. Demo site.</span>
        <nav aria-label="Footer navigation">
          <a href="#workflows">Workflows</a>
          <a href="#stack">Model Stack</a>
          <a href="#demo">Demo</a>
          <a href="#pricing">Pricing</a>
        </nav>
      </footer>
    </main>
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
    <button className={`stack-row ${active ? "active" : ""}`} role="row" onClick={onClick}>
      <span>
        <strong>{model}</strong>
        <em>{label}</em>
      </span>
      <span>{use}</span>
      <span>{quant}</span>
      <span className="apple-pill">Optimized</span>
    </button>
  );
}

function AuditCockpit({
  auditGenerated,
  stack,
  setStack,
  stackInfo
}: {
  auditGenerated: boolean;
  stack: StackKey;
  setStack: (key: StackKey) => void;
  stackInfo: { title: string; sub: string; detail: string; stat: string };
}) {
  return (
    <div className="cockpit" aria-label="Audit cockpit demo">
      <div className="cockpit-top">
        <strong>Audit cockpit</strong>
        <span><CircleDot size={10} fill="currentColor" /> Local session</span>
        <button>Prospect: ACME Family Clinic <ExternalLink size={14} /></button>
      </div>
      <div className="cockpit-grid">
        <article className="prospect-card">
          <div className="browser-bar">
            <span />
            <span />
            <span />
            acmefamilyclinic.com
          </div>
          <div className="clinic-preview">
            <BadgeCheck size={18} />
            <h3>Compassionate care for your family.</h3>
            <p>Primary care for all ages.</p>
            <button>Book appointment</button>
          </div>
        </article>
        <article className="summary-card">
          <h3>Private intake summary</h3>
          {["Business type: private medical clinic", "Team size: validate", "Key systems: EHR, billing, phone, email", "Data sensitivity: high"].map((line) => (
            <p key={line}><Check size={15} /> {line}</p>
          ))}
          <strong><LockKeyhole size={15} /> Local processing only</strong>
        </article>
        <article className="stack-card">
          <h3>Model stack (local)</h3>
          {(Object.keys(stackCards) as StackKey[]).map((key) => (
            <button key={key} className={stack === key ? "selected-model" : ""} onClick={() => setStack(key)}>
              <span>{stackCards[key].sub}</span>
              <strong>{stackCards[key].title}</strong>
            </button>
          ))}
        </article>
        <article className="draft-card">
          <h3>Audit draft {auditGenerated ? "(generated)" : "(local)"}</h3>
          {auditItems.map(({ source, output, impact }) => (
            <p key={source}>
              <Check size={14} />
              {source} → {output}
              <em className={impact.startsWith("High") ? "high" : "medium"}>{impact}</em>
            </p>
          ))}
        </article>
        <article className="approval-card">
          <h3>Human approval</h3>
          <div className="approval-avatar">
            <ClipboardCheck size={20} />
          </div>
          <p>Review outputs before anything is used.</p>
          <button className="approve"><Check size={16} /> Approve all</button>
          <button className="request"><MousePointerClick size={16} /> Request changes</button>
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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
