export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
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

      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    if (url.pathname === "/api/admin/session") {
      if (request.method !== "GET") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }

      const session = await requireAdmin(request, env);
      if (!session.ok) {
        return json({ ok: false, error: "Not authenticated" }, 401);
      }

      return json({ ok: true, user: session.user });
    }

    if (url.pathname === "/api/admin/login") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }

      return loginAdmin(request, env);
    }

    if (url.pathname === "/api/admin/logout") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }

      return json({ ok: true }, 200, {
        "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
      });
    }

    if (url.pathname === "/api/admin/leads") {
      if (request.method !== "GET") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }

      return listAdminLeads(request, env);
    }

    const adminLeadMatch = url.pathname.match(/^\/api\/admin\/leads\/(\d+)$/);
    if (adminLeadMatch) {
      if (request.method !== "PATCH") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }

      return updateAdminLead(request, env, Number(adminLeadMatch[1]));
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

type AdminLoginPayload = {
  username?: unknown;
  password?: unknown;
};

type AdminSession =
  | {
      ok: true;
      user: string;
    }
  | {
      ok: false;
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

const SESSION_COOKIE = "shipaxiom_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const STATUS_VALUES = new Set(["new", "contacted", "qualified", "booked", "won", "lost", "archived"]);

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

async function loginAdmin(request: Request, env: Env) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return json({ ok: false, error: "Admin is not configured" }, 503);
  }

  let payload: AdminLoginPayload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const username = clean(payload.username, 120);
  const password = clean(payload.password, 240);
  const validUser = safeEqual(username, env.ADMIN_USERNAME);
  const validPassword = safeEqual(password, env.ADMIN_PASSWORD);

  if (!validUser || !validPassword) {
    return json({ ok: false, error: "Invalid username or password" }, 401);
  }

  const token = await createSessionToken(env.ADMIN_USERNAME, env.ADMIN_SESSION_SECRET, SESSION_TTL_SECONDS);
  return json({ ok: true, user: env.ADMIN_USERNAME }, 200, {
    "set-cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`
  });
}

async function listAdminLeads(request: Request, env: Env) {
  const session = await requireAdmin(request, env);
  if (!session.ok) {
    return json({ ok: false, error: "Not authenticated" }, 401);
  }

  const leads = await env.DB.prepare(
    `SELECT
      id, created_at, name, email, company, phone, industry, team_size, budget,
      preferred_time, workflow, privacy_needs, package_interest, source, status
    FROM leads
    ORDER BY created_at DESC
    LIMIT 100`
  ).all();

  return json({ ok: true, leads: leads.results });
}

async function updateAdminLead(request: Request, env: Env, id: number) {
  const session = await requireAdmin(request, env);
  if (!session.ok) {
    return json({ ok: false, error: "Not authenticated" }, 401);
  }

  let payload: { status?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const status = clean(payload.status, 40);
  if (!STATUS_VALUES.has(status)) {
    return json({ ok: false, error: "Invalid status" }, 400);
  }

  const result = await env.DB.prepare("UPDATE leads SET status = ? WHERE id = ?").bind(status, id).run();
  if (!result.meta.changes) {
    return json({ ok: false, error: "Lead not found" }, 404);
  }

  return json({ ok: true, id, status });
}

async function requireAdmin(request: Request, env: Env): Promise<AdminSession> {
  if (!env.ADMIN_USERNAME || !env.ADMIN_SESSION_SECRET) {
    return { ok: false };
  }

  const token = readCookie(request.headers.get("cookie") || "", SESSION_COOKIE);
  if (!token) {
    return { ok: false };
  }

  const payload = await verifySessionToken(token, env.ADMIN_SESSION_SECRET);
  if (!payload || payload.exp < Date.now() || payload.user !== env.ADMIN_USERNAME) {
    return { ok: false };
  }

  return { ok: true, user: payload.user };
}

async function createSessionToken(user: string, secret: string, ttlSeconds: number) {
  const payload = base64UrlEncode(
    JSON.stringify({
      user,
      exp: Date.now() + ttlSeconds * 1000
    })
  );
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

async function verifySessionToken(token: string, secret: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = await sign(payload, secret);
  if (!safeEqual(signature, expected)) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(payload)) as { user: string; exp: number };
  } catch {
    return null;
  }
}

async function sign(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncode(signature);
}

function readCookie(cookieHeader: string, name: string) {
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const prefix = `${name}=`;
  const match = cookies.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...apiHeaders(),
      ...extraHeaders
    }
  });
}

function apiHeaders() {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "https://shipaxiom.com",
    "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
    "access-control-allow-headers": "content-type, authorization"
  };
}

function base64UrlEncode(value: string | ArrayBuffer) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function safeEqual(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return diff === 0;
}
