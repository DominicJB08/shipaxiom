CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  day TEXT NOT NULL,
  event_name TEXT NOT NULL,
  page_path TEXT,
  section_id TEXT,
  referrer_host TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  cta_id TEXT,
  form_step TEXT,
  package_interest TEXT,
  video_id TEXT,
  video_milestone INTEGER,
  device_class TEXT,
  browser_family TEXT,
  flow_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_day_name ON analytics_events(day, event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page ON analytics_events(day, page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_flow ON analytics_events(flow_id);
