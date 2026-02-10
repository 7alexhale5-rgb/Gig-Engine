CREATE TABLE gig_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  pillar_id UUID NOT NULL REFERENCES service_pillars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  pricing_basic NUMERIC(10,2),
  pricing_standard NUMERIC(10,2),
  pricing_premium NUMERIC(10,2),
  delivery_days_basic INTEGER,
  delivery_days_standard INTEGER,
  delivery_days_premium INTEGER,
  gig_url TEXT DEFAULT '',
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,4) DEFAULT 0,
  revenue_total NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gig_listings_platform ON gig_listings(platform_id);
CREATE INDEX idx_gig_listings_pillar ON gig_listings(pillar_id);
CREATE INDEX idx_gig_listings_status ON gig_listings(status);
