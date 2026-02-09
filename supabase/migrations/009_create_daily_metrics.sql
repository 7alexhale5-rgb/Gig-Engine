CREATE TABLE daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE,
  proposals_sent INTEGER DEFAULT 0,
  proposals_viewed INTEGER DEFAULT 0,
  responses_received INTEGER DEFAULT 0,
  contracts_won INTEGER DEFAULT 0,
  gig_impressions INTEGER DEFAULT 0,
  gig_clicks INTEGER DEFAULT 0,
  gig_orders INTEGER DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, platform_id)
);

CREATE INDEX idx_daily_metrics_date ON daily_metrics(date DESC);
