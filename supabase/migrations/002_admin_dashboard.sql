-- Admin analytics + notifications + fallback product table

CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT,
  visitor_key TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_key);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- No policies -> blocked for anon/authenticated. service_role bypasses RLS.

CREATE TABLE IF NOT EXISTS admin_alerts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'general',
  level TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  order_ref TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_created_at ON admin_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_is_read ON admin_alerts(is_read);

ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

-- Optional fallback if legacy Product table is not present.
CREATE TABLE IF NOT EXISTS admin_products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category_id TEXT NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  description TEXT NOT NULL,
  details TEXT NOT NULL,
  sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  collections JSONB NOT NULL DEFAULT '[]'::jsonb,
  occasions JSONB NOT NULL DEFAULT '[]'::jsonb,
  florist_id TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  is_new BOOLEAN NOT NULL DEFAULT TRUE,
  is_best BOOLEAN NOT NULL DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_products_created_at ON admin_products(created_at DESC);

ALTER TABLE admin_products ENABLE ROW LEVEL SECURITY;
