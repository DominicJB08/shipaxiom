import React, { type FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Code2,
  DatabaseZap,
  ExternalLink,
  FileSearch,
  Inbox,
  KeyRound,
  LockKeyhole,
  LogOut,
  Map,
  Mail,
  MousePointerClick,
  Phone,
  RefreshCw,
  Rocket,
  Search,
  Send,
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
type LeadStatus = "new" | "contacted" | "qualified" | "booked" | "won" | "lost" | "archived";

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

const workflowSteps: WorkflowStep[] = [
  { title: "Map", text: "We map your repetitive work, systems, and data boundaries.", icon: FileSearch },
  { title: "Find the wedge", text: "We identify the highest-impact, lowest-risk automation.", icon: Target },
  { title: "Design", text: "We design prompts, guardrails, and review steps.", icon: Code2 },
  { title: "Build remote", text: "We build the first workflow remotely in a private workspace.", icon: Bot },
  { title: "Validate", text: "You review outputs before anything ships.", icon: ShieldCheck },
  { title: "Ship", text: "We deploy to existing client hardware, a private server, or a managed cloud worker.", icon: Rocket },
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
    title: "Remote private workspace",
    sub: "Default pilot path",
    detail: "Private build environment for intake, prompts, automation logic, and review artifacts without buying hardware first.",
    stat: "No AI PC required"
  },
  fallback: {
    title: "Client-owned Mac or server",
    sub: "Local install path",
    detail: "If the client already has suitable hardware, we install and document the local model workflow remotely.",
    stat: "Existing hardware"
  },
  specialist: {
    title: "On-site appliance build",
    sub: "Scoped add-on",
    detail: "Only quoted when the client needs on-prem hardware and pays for the machine, travel, and setup.",
    stat: "Not the default"
  }
};

const pricing = [
  {
    title: "AI Workflow Audit",
    price: "$2,500",
    note: "One-time",
    bullets: ["Workflow and system map", "Top opportunities and risk", "Privacy boundary review", "Pilot scope and quote"]
  },
  {
    title: "Ship Sprint",
    price: "$9,500",
    note: "Fixed scope",
    featured: true,
    bullets: ["Everything in the audit", "Build and test one workflow", "Private remote deployment", "30-day handover support"]
  },
  {
    title: "Ops Care",
    price: "$1,250",
    note: "Per month",
    bullets: ["Workflow improvements", "New automations", "Monitoring and guardrails", "Priority support"]
  }
];

const deliveryOptions = [
  {
    title: "Remote-first pilot",
    text: "We prove the workflow remotely first, using private project infrastructure and human approval gates.",
    tag: "Default"
  },
  {
    title: "Existing client hardware",
    text: "If a client already has a capable Mac, workstation, or server, we can install the workflow remotely.",
    tag: "Local when practical"
  },
  {
    title: "Hardware as an add-on",
    text: "On-site PC builds are quoted separately so travel and equipment never come out of the pilot budget.",
    tag: "Scoped separately"
  }
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
  if (window.location.pathname === "/admin") {
    return <AdminApp />;
  }

  const [stack, setStack] = useState<StackKey>("daily");
  const [auditGenerated, setAuditGenerated] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Ship Sprint");
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
          <a href="#stack">Delivery Model</a>
          <a href="#walkthrough">Video</a>
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
            Ship Axiom maps repetitive admin, proves the safest private-AI wedge, and ships a
            first workflow without forcing a hardware purchase or an on-site AI PC build.
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => setAuditGenerated(true)}>
              <Sparkles size={18} />
              Generate an audit
            </button>
            <a className="secondary-action" href="#stack">
              Delivery model
              <ChevronRight size={17} />
            </a>
          </div>
          <div className="trust-row" aria-label="Key promises">
            <TrustItem icon={LockKeyhole} title="Privacy-first by default" text="Sensitive work stays in scoped private systems." />
            <TrustItem icon={ShieldCheck} title="Human in the loop" text="Every output reviewed before it ships." />
            <TrustItem icon={Zap} title="Remote-first delivery" text="Hardware is quoted only when it is actually needed." />
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
          <h2>Private delivery stack. Right environment. Right job.</h2>
          <p>
            We start remote-first so the pilot can sell and ship quickly. Local deployment is
            available when the client already has the right hardware or funds it as an add-on.
          </p>
          <a href="#demo">Explore the delivery model <ArrowRight size={15} /></a>
        </div>
        <div className="stack-table" role="table" aria-label="Private delivery model comparison">
          <div className="stack-row stack-head" role="row">
            <span>Path</span>
            <span>Use for</span>
            <span>Cost risk</span>
            <span>Default?</span>
          </div>
          <StackRow active={stack === "daily"} onClick={() => setStack("daily")} label="Default" model="Remote private workspace" use="Audit, workflow build, automation logic, review artifacts" quant="Low" />
          <StackRow active={stack === "fallback"} onClick={() => setStack("fallback")} label="Local if available" model="Client-owned Mac or server" use="Sensitive workflows where the client already owns suitable hardware" quant="Medium" />
          <StackRow active={stack === "specialist"} onClick={() => setStack("specialist")} label="Add-on" model="On-site appliance build" use="Air-gapped or regulated clients that fund hardware, travel, and setup" quant="Quoted" />
        </div>
      </section>

      <section className="delivery-section section-shell">
        <div className="section-heading">
          <h2>No expensive hardware promise up front</h2>
          <p>The business model is designed to sell remotely first and avoid cash-heavy installs until a client funds them.</p>
        </div>
        <div className="delivery-grid">
          {deliveryOptions.map((option) => (
            <article className="delivery-card" key={option.title}>
              <span>{option.tag}</span>
              <h3>{option.title}</h3>
              <p>{option.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="walkthrough" className="video-section section-shell">
        <div className="section-heading video-heading">
          <h2>Watch the workflow: manual work vs AI-assisted review</h2>
          <p>
            Example: an intake packet becomes structured fields, a summary, and a human-approved
            task list without removing staff from the final decision.
          </p>
          <div className="saving-metrics" aria-label="Workflow time comparison">
            <span><strong>45 min</strong> human-only</span>
            <span><strong>6 min</strong> AI-assisted</span>
            <span><strong>39 min</strong> saved per packet</span>
          </div>
        </div>
        <div className="video-shell">
          <video
            controls
            playsInline
            preload="metadata"
            poster="/media/workflow-demo-poster.jpg"
            aria-label="Ship Axiom example workflow video comparing manual intake review with AI-assisted review"
          >
            <source src="/media/workflow-demo.mp4" type="video/mp4" />
            <source src="/media/workflow-demo.webm" type="video/webm" />
          </video>
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
            <span>Environment: {stackInfo.title}</span>
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

      <section className="image-band section-shell" aria-label="Private AI workflow preview">
        <img src="/images/local-ai-workstation.png" alt="Private AI workflow cockpit on a workstation" />
        <div>
          <h2>Built for the machines already in the room.</h2>
          <p>
            The first proof-of-value runs remotely unless the client already has suitable hardware.
            Local AI installs stay available, but only as a funded deployment path.
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
        <div className="booking-copy">
          <h2>Book the audit. Keep payment for later.</h2>
          <p>Tell us where the admin work is getting stuck. We will reply with next steps and scheduling options.</p>
          <a href="mailto:hello@shipaxiom.com?subject=Private%20AI%20Workflow%20Audit">hello@shipaxiom.com</a>
        </div>
        <LeadForm selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
      </section>

      <footer className="site-footer">
        <a className="brand small" href="#top">
          <span className="brand-mark"><span /></span>
          <span>Ship Axiom</span>
        </a>
        <span>© 2026 Ship Axiom. Private AI workflow audits.</span>
        <nav aria-label="Footer navigation">
          <a href="#workflows">Workflows</a>
          <a href="#stack">Delivery Model</a>
          <a href="#walkthrough">Video</a>
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

function AdminApp() {
  const [session, setSession] = useState<"checking" | "authenticated" | "anonymous">("checking");
  const [adminUser, setAdminUser] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginMessage, setLoginMessage] = useState("");
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    void checkSession();
  }, []);

  useEffect(() => {
    if (session === "authenticated") {
      void loadLeads();
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

  const metrics = useMemo(
    () => ({
      total: leads.length,
      new: leads.filter((lead) => lead.status === "new").length,
      active: leads.filter((lead) => ["contacted", "qualified", "booked"].includes(lead.status)).length,
      won: leads.filter((lead) => lead.status === "won").length
    }),
    [leads]
  );

  const selectedLead = leads.find((lead) => lead.id === selectedId) || filteredLeads[0] || null;

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

  async function loadLeads() {
    setLoadingLeads(true);
    setAdminError("");

    try {
      const response = await fetch("/api/admin/leads", { credentials: "include" });
      const result = (await response.json()) as { ok: boolean; leads?: AdminLead[]; error?: string };

      if (response.status === 401) {
        setSession("anonymous");
        setLeads([]);
        return;
      }

      if (!response.ok || !result.ok) {
        setAdminError(result.error || "Could not load booking requests.");
        return;
      }

      setLeads((result.leads || []).map((lead) => ({ ...lead, status: lead.status || "new" })));
    } catch {
      setAdminError("Could not load booking requests.");
    } finally {
      setLoadingLeads(false);
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
    setAdminUser("");
  }

  if (session === "checking") {
    return (
      <main className="admin-page admin-login">
        <section className="admin-login-card">
          <a className="brand small" href="/">
            <span className="brand-mark"><span /></span>
            <span>Ship Axiom</span>
          </a>
          <div className="admin-login-icon">
            <RefreshCw size={24} />
          </div>
          <h1>Checking session</h1>
        </section>
      </main>
    );
  }

  if (session === "anonymous") {
    return (
      <main className="admin-page admin-login">
        <section className="admin-login-card">
          <a className="brand small" href="/">
            <span className="brand-mark"><span /></span>
            <span>Ship Axiom</span>
          </a>
          <div className="admin-login-icon">
            <KeyRound size={24} />
          </div>
          <h1>Admin access</h1>
          <p>View booking requests, contact details, workflow notes, and pipeline status.</p>
          <form className="admin-login-form" onSubmit={submitLogin}>
            <label>
              Username
              <input
                required
                autoComplete="username"
                value={loginForm.username}
                onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <button className="admin-button dark" type="submit">
              <KeyRound size={17} />
              Sign in
            </button>
            {loginMessage && <p className="admin-error">{loginMessage}</p>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="brand small" href="/">
          <span className="brand-mark"><span /></span>
          <span>Ship Axiom</span>
        </a>
        <div className="admin-title">
          <span>Admin</span>
          <strong>Bookings pipeline</strong>
        </div>
        <div className="admin-actions">
          <span className="admin-user">{adminUser}</span>
          <button className="admin-button" type="button" onClick={() => void loadLeads()} disabled={loadingLeads}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="admin-button" type="button" onClick={() => void logout()}>
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </header>

      <section className="admin-metrics" aria-label="Booking metrics">
        <article className="admin-metric">
          <span>Total requests</span>
          <strong>{metrics.total}</strong>
          <small>Latest 100 leads</small>
        </article>
        <article className="admin-metric">
          <span>New</span>
          <strong>{metrics.new}</strong>
          <small>Needs first touch</small>
        </article>
        <article className="admin-metric">
          <span>Active</span>
          <strong>{metrics.active}</strong>
          <small>Contacted, qualified, booked</small>
        </article>
        <article className="admin-metric">
          <span>Won</span>
          <strong>{metrics.won}</strong>
          <small>Closed pipeline</small>
        </article>
      </section>

      <section className="admin-toolbar" aria-label="Lead filters">
        <label className="admin-search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads" />
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "all")}>
            <option value="all">All statuses</option>
            {leadStatuses.map((status) => (
              <option value={status} key={status}>{statusLabels[status]}</option>
            ))}
          </select>
        </label>
        <span>{filteredLeads.length} shown</span>
      </section>

      {adminError && <p className="admin-error wide">{adminError}</p>}

      <section className="admin-grid">
        <div className="lead-list" aria-label="Booking requests">
          {loadingLeads ? (
            <div className="empty-admin">
              <RefreshCw size={22} />
              <strong>Loading requests</strong>
            </div>
          ) : filteredLeads.length ? (
            filteredLeads.map((lead) => (
              <button
                className={`lead-row ${selectedLead?.id === lead.id ? "active" : ""}`}
                key={lead.id}
                type="button"
                onClick={() => setSelectedId(lead.id)}
              >
                <span className="lead-row-top">
                  <strong>{lead.company}</strong>
                  <em className={`status-chip ${lead.status}`}>{statusLabels[lead.status]}</em>
                </span>
                <span>{lead.name} · {lead.email}</span>
                <small>{lead.package_interest} · {formatDate(lead.created_at)}</small>
              </button>
            ))
          ) : (
            <div className="empty-admin">
              <Inbox size={24} />
              <strong>No booking requests found</strong>
              <span>Adjust the search or status filter.</span>
            </div>
          )}
        </div>

        <aside className="lead-detail" aria-label="Selected booking request">
          {selectedLead ? (
            <>
              <div className="detail-header">
                <div>
                  <span>Lead #{selectedLead.id}</span>
                  <h1>{selectedLead.company}</h1>
                  <p>{formatDate(selectedLead.created_at)}</p>
                </div>
                <label>
                  Status
                  <select
                    value={selectedLead.status}
                    disabled={updatingId === selectedLead.id}
                    onChange={(event) => void updateLeadStatus(selectedLead.id, event.target.value as LeadStatus)}
                  >
                    {leadStatuses.map((status) => (
                      <option value={status} key={status}>{statusLabels[status]}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="detail-actions">
                <a href={`mailto:${selectedLead.email}`}>
                  <Mail size={16} />
                  Email
                </a>
                {selectedLead.phone && (
                  <a href={`tel:${selectedLead.phone.replace(/[^\d+]/g, "")}`}>
                    <Phone size={16} />
                    Call
                  </a>
                )}
              </div>

              <div className="detail-grid">
                <DetailItem icon={Mail} label="Contact" value={`${selectedLead.name} · ${selectedLead.email}`} />
                <DetailItem icon={Phone} label="Phone" value={selectedLead.phone || "Not provided"} />
                <DetailItem icon={Building2} label="Industry" value={selectedLead.industry} />
                <DetailItem icon={UserCheck} label="Team size" value={selectedLead.team_size} />
                <DetailItem icon={Target} label="Budget" value={selectedLead.budget} />
                <DetailItem icon={CalendarDays} label="Best time" value={selectedLead.preferred_time || "Not provided"} />
              </div>

              <section className="detail-block">
                <span>Package</span>
                <p>{selectedLead.package_interest}</p>
              </section>
              <section className="detail-block">
                <span>Workflow to fix first</span>
                <p>{selectedLead.workflow}</p>
              </section>
              <section className="detail-block">
                <span>Privacy or deployment needs</span>
                <p>{selectedLead.privacy_needs || "Not provided"}</p>
              </section>
            </>
          ) : (
            <div className="empty-admin">
              <Inbox size={24} />
              <strong>Select a request</strong>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="detail-item">
      <Icon size={17} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
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

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

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
        return;
      }

      setStatus("success");
      setMessage(`Request received${result.id ? ` #${result.id}` : ""}. We will reply with next steps and scheduling options.`);
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
    } catch {
      setStatus("error");
      setMessage("Could not send the request. Email hello@shipaxiom.com if this keeps happening.");
    }
  }

  return (
    <form className="lead-form" onSubmit={submitLead}>
      <label className="hidden-field">
        Website
        <input value={form.website} onChange={(event) => updateField("website", event.target.value)} tabIndex={-1} autoComplete="off" />
      </label>
      <div className="form-grid">
        <label>
          Name
          <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} autoComplete="name" />
        </label>
        <label>
          Work email
          <input required type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} autoComplete="email" />
        </label>
        <label>
          Company
          <input required value={form.company} onChange={(event) => updateField("company", event.target.value)} autoComplete="organization" />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} autoComplete="tel" />
        </label>
        <label>
          Industry
          <select required value={form.industry} onChange={(event) => updateField("industry", event.target.value)}>
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
          <select required value={form.teamSize} onChange={(event) => updateField("teamSize", event.target.value)}>
            <option value="">Select</option>
            <option>1-5</option>
            <option>6-15</option>
            <option>16-50</option>
            <option>51+</option>
          </select>
        </label>
        <label>
          Budget range
          <select required value={form.budget} onChange={(event) => updateField("budget", event.target.value)}>
            <option value="">Select</option>
            <option>$2,500 audit first</option>
            <option>$9,500 sprint ready</option>
            <option>$15,000+ regulated pilot</option>
            <option>Need guidance</option>
          </select>
        </label>
        <label>
          Package interest
          <select required value={selectedPlan} onChange={(event) => setSelectedPlan(event.target.value)}>
            {pricing.map((plan) => (
              <option key={plan.title}>{plan.title}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Workflow to fix first
        <textarea required value={form.workflow} onChange={(event) => updateField("workflow", event.target.value)} placeholder="Example: intake forms, insurance verification, monthly reports, contracts, follow-up emails..." />
      </label>
      <label>
        Privacy or deployment needs
        <textarea value={form.privacyNeeds} onChange={(event) => updateField("privacyNeeds", event.target.value)} placeholder="Example: HIPAA sensitivity, client data boundaries, existing Mac/server, no cloud storage, or no special requirements." />
      </label>
      <label>
        Best times for a 30-minute call
        <input value={form.preferredTime} onChange={(event) => updateField("preferredTime", event.target.value)} placeholder="Example: Tue or Thu after 2pm PT" />
      </label>
      <button className="blue-action" disabled={status === "submitting"} type="submit">
        {status === "submitting" ? <CalendarDays size={19} /> : <Send size={19} />}
        {status === "submitting" ? "Sending request" : "Request audit call"}
      </button>
      {message && <p className={`form-message ${status}`}>{message}</p>}
    </form>
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
        <span><CircleDot size={10} fill="currentColor" /> Private session</span>
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
          <strong><LockKeyhole size={15} /> Private routing only</strong>
        </article>
        <article className="stack-card">
          <h3>Delivery stack</h3>
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
