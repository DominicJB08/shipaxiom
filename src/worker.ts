export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if ((url.hostname === "shipaxiom.com" || url.hostname === "www.shipaxiom.com") && url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/robots.txt") {
      return text(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${url.origin}/sitemap.xml\n`, "text/plain; charset=utf-8");
    }

    if (url.pathname === "/sitemap.xml") {
      return text(generateSitemap(url.origin), "application/xml; charset=utf-8");
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "shipaxiom", timestamp: new Date().toISOString() });
    }

    if (url.pathname === "/api/analytics/event") {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: apiHeaders() });
      }

      if (request.method === "POST") {
        return collectAnalyticsEvent(request, env, ctx);
      }

      return json({ ok: false, error: "Method not allowed" }, 405);
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

    if (url.pathname === "/api/admin/analytics") {
      if (request.method !== "GET") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }

      return getAdminAnalytics(request, env);
    }

    if (request.method === "GET" && acceptsHtml(request) && isUnknownPublicRoute(url.pathname)) {
      return withSecurityHeaders(new Response("Not found", {
        status: 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store"
        }
      }), url.pathname);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    return withSecurityHeaders(assetResponse, url.pathname);
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(pruneAnalytics(env));
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

type AnalyticsPayload = {
  eventId?: unknown;
  eventName?: unknown;
  pagePath?: unknown;
  sectionId?: unknown;
  referrerHost?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  ctaId?: unknown;
  formStep?: unknown;
  packageInterest?: unknown;
  videoId?: unknown;
  videoMilestone?: unknown;
  deviceClass?: unknown;
  browserFamily?: unknown;
  flowId?: unknown;
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
const ANALYTICS_EVENTS = new Set([
  "page_view",
  "cta_click",
  "pricing_selected",
  "form_start",
  "form_submit_attempt",
  "form_submit_success",
  "form_submit_error",
  "sample_audit_view",
  "sample_audit_generate",
  "video_play",
  "video_progress",
  "video_complete",
  "mailto_click",
  "phone_click"
]);

const SITE_ROUTES = [
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
];
const SITE_ROUTE_SET = new Set(SITE_ROUTES);
const CTA_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,119}$/;
const VIDEO_IDS = new Set(["workflow-demo"]);
const VIDEO_MILESTONES = new Set([0, 25, 50, 75, 90, 100]);

async function createLead(request: Request, env: Env) {
  let payload: LeadPayload;
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 16384) {
    return json({ ok: false, error: "Lead request is too large" }, 413);
  }

  try {
    payload = await readLeadPayload(request);
  } catch {
    return json({ ok: false, error: "Invalid request body" }, 400);
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
      null
    )
    .run();

  return json({ ok: true, id: result.meta.last_row_id });
}

async function readLeadPayload(request: Request): Promise<LeadPayload> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return {
      name: formString(form, "name"),
      email: formString(form, "email"),
      company: formString(form, "company"),
      phone: formString(form, "phone"),
      industry: formString(form, "industry"),
      teamSize: formString(form, "teamSize") || formString(form, "team_size"),
      budget: formString(form, "budget"),
      preferredTime: formString(form, "preferredTime") || formString(form, "preferred_time"),
      workflow: formString(form, "workflow"),
      privacyNeeds: formString(form, "privacyNeeds") || formString(form, "privacy_needs"),
      packageInterest: formString(form, "packageInterest") || formString(form, "package_interest"),
      website: formString(form, "website")
    };
  }

  return request.json();
}

function formString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

async function collectAnalyticsEvent(request: Request, env: Env, ctx: ExecutionContext) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 8192) {
    return json({ ok: false, error: "Analytics event is too large" }, 413);
  }

  let payload: AnalyticsPayload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const eventName = clean(payload.eventName, 60);
  if (!ANALYTICS_EVENTS.has(eventName)) {
    return json({ ok: false, error: "Unknown analytics event" }, 400);
  }

  const validation = validateAnalyticsPayload(payload);
  if (!validation.ok) {
    return json({ ok: false, error: validation.error }, 400);
  }

  ctx.waitUntil(insertAnalyticsEvent(payload, env));
  return new Response(null, { status: 204, headers: apiHeaders() });
}

async function insertAnalyticsEvent(payload: AnalyticsPayload, env: Env) {
  const eventName = clean(payload.eventName, 60);
  const now = new Date();
  const eventId = clean(payload.eventId, 80) || crypto.randomUUID();
  const pagePath = normalizePathValue(payload.pagePath);
  const videoMilestone = typeof payload.videoMilestone === "number" ? Math.max(0, Math.min(100, Math.round(payload.videoMilestone))) : null;

  await env.DB.prepare(
    `INSERT OR IGNORE INTO analytics_events (
      event_id, day, event_name, page_path, section_id, referrer_host, utm_source,
      utm_medium, utm_campaign, cta_id, form_step, package_interest, video_id,
      video_milestone, device_class, browser_family, flow_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      eventId,
      now.toISOString().slice(0, 10),
      eventName,
      pagePath,
      clean(payload.sectionId, 80) || null,
      clean(payload.referrerHost, 120) || null,
      clean(payload.utmSource, 80) || null,
      clean(payload.utmMedium, 80) || null,
      clean(payload.utmCampaign, 120) || null,
      clean(payload.ctaId, 120) || null,
      clean(payload.formStep, 80) || null,
      clean(payload.packageInterest, 120) || null,
      clean(payload.videoId, 120) || null,
      videoMilestone,
      clean(payload.deviceClass, 40) || null,
      clean(payload.browserFamily, 60) || null,
      clean(payload.flowId, 80) || null
    )
    .run();
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

async function getAdminAnalytics(request: Request, env: Env) {
  const session = await requireAdmin(request, env);
  if (!session.ok) {
    return json({ ok: false, error: "Not authenticated" }, 401);
  }

  const url = new URL(request.url);
  const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") || "30") || 30));
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const totalsRows = (await env.DB.prepare(
    `SELECT event_name, COUNT(*) AS total
    FROM analytics_events
    WHERE day >= ?
    GROUP BY event_name`
  ).bind(since).all()).results as Array<{ event_name: string; total: number }>;

  const pageRows = (await env.DB.prepare(
    `SELECT page_path, COUNT(*) AS views, COUNT(DISTINCT flow_id) AS sessions
    FROM analytics_events
    WHERE day >= ? AND event_name = 'page_view' AND page_path IS NOT NULL
    GROUP BY page_path
    ORDER BY views DESC
    LIMIT 12`
  ).bind(since).all()).results as Array<{ page_path: string; views: number; sessions: number }>;

  const ctaRows = (await env.DB.prepare(
    `SELECT cta_id, COUNT(*) AS clicks
    FROM analytics_events
    WHERE day >= ? AND event_name = 'cta_click' AND cta_id IS NOT NULL
    GROUP BY cta_id
    ORDER BY clicks DESC
    LIMIT 12`
  ).bind(since).all()).results as Array<{ cta_id: string; clicks: number }>;

  const dailyRows = (await env.DB.prepare(
    `SELECT
      day,
      SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS page_views,
      SUM(CASE WHEN event_name = 'cta_click' THEN 1 ELSE 0 END) AS cta_clicks,
      SUM(CASE WHEN event_name = 'form_start' THEN 1 ELSE 0 END) AS form_starts,
      SUM(CASE WHEN event_name = 'form_submit_success' THEN 1 ELSE 0 END) AS form_submits
    FROM analytics_events
    WHERE day >= ?
    GROUP BY day
    ORDER BY day ASC`
  ).bind(since).all()).results as Array<{ day: string; page_views: number; cta_clicks: number; form_starts: number; form_submits: number }>;

  const videoRows = (await env.DB.prepare(
    `SELECT COALESCE(video_milestone, 0) AS milestone, COUNT(*) AS total
    FROM analytics_events
    WHERE day >= ? AND event_name IN ('video_play', 'video_progress', 'video_complete')
    GROUP BY milestone
    ORDER BY milestone ASC`
  ).bind(since).all()).results as Array<{ milestone: number; total: number }>;

  const recentRows = (await env.DB.prepare(
    `SELECT received_at, event_name, page_path, cta_id, form_step, package_interest, video_milestone, device_class
    FROM analytics_events
    WHERE day >= ?
    ORDER BY received_at DESC
    LIMIT 30`
  ).bind(since).all()).results as Array<Record<string, unknown>>;

  const totals = totalsRows.reduce<Record<string, number>>((current, row) => {
    current[row.event_name] = Number(row.total || 0);
    return current;
  }, {});

  const pageViews = totals.page_view || 0;
  const formStarts = totals.form_start || 0;
  const formSubmits = totals.form_submit_success || 0;

  return json({
    ok: true,
    range: { days, since },
    totals: {
      pageViews,
      ctaClicks: totals.cta_click || 0,
      formStarts,
      formAttempts: totals.form_submit_attempt || 0,
      formErrors: totals.form_submit_error || 0,
      formSubmits,
      sampleAuditViews: totals.sample_audit_view || 0,
      sampleAuditGenerates: totals.sample_audit_generate || 0,
      pricingSelections: totals.pricing_selected || 0,
      mailClicks: totals.mailto_click || 0,
      phoneClicks: totals.phone_click || 0,
      videoEvents: (totals.video_play || 0) + (totals.video_progress || 0) + (totals.video_complete || 0),
      conversionRate: pageViews ? Math.round((formSubmits / pageViews) * 1000) / 10 : 0
    },
    funnel: [
      { stage: "Visits", total: pageViews },
      { stage: "CTA clicks", total: totals.cta_click || 0 },
      { stage: "Sample audits", total: totals.sample_audit_view || 0 },
      { stage: "Form starts", total: formStarts },
      { stage: "Submit attempts", total: totals.form_submit_attempt || 0 },
      { stage: "Submitted leads", total: formSubmits }
    ],
    topPages: pageRows,
    topCtas: ctaRows,
    daily: dailyRows,
    video: videoRows,
    recentEvents: recentRows
  });
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

function normalizePathValue(value: unknown) {
  const path = clean(value, 220);
  if (!path || !path.startsWith("/") || path.startsWith("/api/") || path.startsWith("/admin")) {
    return "/";
  }

  const normalized = path.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
  return SITE_ROUTE_SET.has(normalized) ? normalized : "/";
}

function validateAnalyticsPayload(payload: AnalyticsPayload): { ok: true } | { ok: false; error: string } {
  const eventName = clean(payload.eventName, 60);
  const path = normalizePathValue(payload.pagePath);
  const eventId = clean(payload.eventId, 80);
  const ctaId = clean(payload.ctaId, 120);
  const videoId = clean(payload.videoId, 120);
  const flowId = clean(payload.flowId, 80);

  if (!eventId || eventId.startsWith("smoke-test-") || eventId.includes("synthetic") || eventId.includes("review")) {
    return { ok: false, error: "Invalid event id" };
  }

  if (path === "/" && clean(payload.pagePath, 220) !== "/") {
    return { ok: false, error: "Unknown page path" };
  }

  if (["cta_click", "pricing_selected", "mailto_click", "phone_click"].includes(eventName) && !CTA_ID_PATTERN.test(ctaId)) {
    return { ok: false, error: "Missing or invalid CTA id" };
  }

  if (eventName.startsWith("video_")) {
    const milestone = typeof payload.videoMilestone === "number" ? Math.round(payload.videoMilestone) : -1;
    if (!VIDEO_IDS.has(videoId) || !VIDEO_MILESTONES.has(milestone)) {
      return { ok: false, error: "Invalid video event" };
    }
  }

  if (eventName.startsWith("form_") && !clean(payload.packageInterest, 120)) {
    return { ok: false, error: "Missing package interest" };
  }

  if (flowId && !/^[a-z0-9-]{12,80}$/i.test(flowId)) {
    return { ok: false, error: "Invalid flow id" };
  }

  return { ok: true };
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
    ...securityHeaders(),
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-robots-tag": "noindex, noarchive",
    "access-control-allow-origin": "https://shipaxiom.com",
    "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
    "access-control-allow-headers": "content-type, authorization"
  };
}

function text(body: string, contentType: string) {
  return new Response(body, {
    headers: {
      ...securityHeaders(),
      "content-type": contentType,
      "cache-control": "public, max-age=3600"
    }
  });
}

function withSecurityHeaders(response: Response, pathname: string) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders())) {
    headers.set(key, value);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    headers.set("x-robots-tag", "noindex, noarchive");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function securityHeaders() {
  return {
    "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "content-security-policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "media-src 'self'",
      "connect-src 'self'",
      "base-uri 'self'",
      "form-action 'self' mailto:",
      "frame-ancestors 'none'"
    ].join("; ")
  };
}

function acceptsHtml(request: Request) {
  return (request.headers.get("accept") || "").includes("text/html");
}

function isUnknownPublicRoute(pathname: string) {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return false;
  }
  if (pathname.includes(".")) {
    return false;
  }
  const route = pathname.replace(/\/$/, "") || "/";
  return !SITE_ROUTE_SET.has(route);
}

async function pruneAnalytics(env: Env) {
  await env.DB.prepare("DELETE FROM analytics_events WHERE day < date('now', '-90 days')").run();
}

function generateSitemap(origin: string) {
  const urls = SITE_ROUTES.map((route) => {
    const loc = `${origin}${route}`;
    return `  <url><loc>${loc}</loc><changefreq>${route === "/" ? "weekly" : "monthly"}</changefreq></url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
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
