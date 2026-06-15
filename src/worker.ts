export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ADMIN_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "shipaxiom", timestamp: new Date().toISOString() });
    }

    if (url.pathname === "/api/leads") {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: apiHeaders() });
      }

      if (request.method === "POST") {
        return createLead(request, env);
      }

      if (request.method === "GET") {
        return listLeads(request, env);
      }

      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    return env.ASSETS.fetch(request);
  }
};

type LeadPayload = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  phone?: unknown;
  industry?: unknown;
  teamSize?: unknown;
  budget?: unknown;
  preferredTime?: unknown;
  workflow?: unknown;
  privacyNeeds?: unknown;
  packageInterest?: unknown;
  website?: unknown;
};

const MAX_LENGTHS = {
  name: 120,
  email: 180,
  company: 160,
  phone: 60,
  industry: 120,
  teamSize: 80,
  budget: 80,
  preferredTime: 160,
  workflow: 1200,
  privacyNeeds: 800,
  packageInterest: 120
};

async function createLead(request: Request, env: Env) {
  let payload: LeadPayload;

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  if (clean(payload.website, 200)) {
    return json({ ok: true, id: null });
  }

  const lead = {
    name: clean(payload.name, MAX_LENGTHS.name),
    email: clean(payload.email, MAX_LENGTHS.email).toLowerCase(),
    company: clean(payload.company, MAX_LENGTHS.company),
    phone: clean(payload.phone, MAX_LENGTHS.phone),
    industry: clean(payload.industry, MAX_LENGTHS.industry),
    teamSize: clean(payload.teamSize, MAX_LENGTHS.teamSize),
    budget: clean(payload.budget, MAX_LENGTHS.budget),
    preferredTime: clean(payload.preferredTime, MAX_LENGTHS.preferredTime),
    workflow: clean(payload.workflow, MAX_LENGTHS.workflow),
    privacyNeeds: clean(payload.privacyNeeds, MAX_LENGTHS.privacyNeeds),
    packageInterest: clean(payload.packageInterest, MAX_LENGTHS.packageInterest)
  };

  const missing = [
    ["name", lead.name],
    ["email", lead.email],
    ["company", lead.company],
    ["industry", lead.industry],
    ["teamSize", lead.teamSize],
    ["budget", lead.budget],
    ["workflow", lead.workflow],
    ["packageInterest", lead.packageInterest]
  ]
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (missing.length > 0) {
    return json({ ok: false, error: "Missing required fields", fields: missing }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return json({ ok: false, error: "Enter a valid email address", fields: ["email"] }, 400);
  }

  const result = await env.DB.prepare(
    `INSERT INTO leads (
      name, email, company, phone, industry, team_size, budget, preferred_time,
      workflow, privacy_needs, package_interest, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      lead.name,
      lead.email,
      lead.company,
      lead.phone || null,
      lead.industry,
      lead.teamSize,
      lead.budget,
      lead.preferredTime || null,
      lead.workflow,
      lead.privacyNeeds || null,
      lead.packageInterest,
      request.headers.get("user-agent") || null
    )
    .run();

  return json({ ok: true, id: result.meta.last_row_id });
}

async function listLeads(request: Request, env: Env) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return json({ ok: false, error: "Not found" }, 404);
  }

  const leads = await env.DB.prepare(
    `SELECT
      id, created_at, name, email, company, phone, industry, team_size, budget,
      preferred_time, workflow, privacy_needs, package_interest, status
    FROM leads
    ORDER BY created_at DESC
    LIMIT 50`
  ).all();

  return json({ ok: true, leads: leads.results });
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: apiHeaders()
  });
}

function apiHeaders() {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "https://shipaxiom.com",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization"
  };
}
