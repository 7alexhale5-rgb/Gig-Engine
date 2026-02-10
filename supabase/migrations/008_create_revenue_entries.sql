CREATE TABLE revenue_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  platform_id UUID REFERENCES platforms(id) ON DELETE SET NULL,
  pillar_id UUID REFERENCES service_pillars(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  entry_type TEXT DEFAULT 'gig_payment' CHECK (entry_type IN ('gig_payment', 'retainer', 'bonus', 'tip')),
  received_date DATE NOT NULL,
  platform_fee_amount NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(10,2) GENERATED ALWAYS AS (amount - platform_fee_amount) STORED,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revenue_entries_date ON revenue_entries(received_date DESC);
CREATE INDEX idx_revenue_entries_platform ON revenue_entries(platform_id);
CREATE INDEX idx_revenue_entries_pillar ON revenue_entries(pillar_id);
