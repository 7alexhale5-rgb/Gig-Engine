CREATE TABLE opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  pillar_id UUID REFERENCES service_pillars(id) ON DELETE SET NULL,
  gig_id UUID REFERENCES gig_listings(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'discovered' CHECK (stage IN ('discovered', 'proposal_sent', 'interview', 'contracted', 'in_progress', 'delivered', 'review_requested', 'complete', 'lost')),
  job_title TEXT NOT NULL,
  job_url TEXT DEFAULT '',
  job_description TEXT DEFAULT '',
  client_name TEXT DEFAULT '',
  client_company TEXT DEFAULT '',
  client_location TEXT DEFAULT '',
  budget_min NUMERIC(10,2),
  budget_max NUMERIC(10,2),
  contract_type TEXT DEFAULT 'fixed' CHECK (contract_type IN ('fixed', 'hourly')),
  proposal_text TEXT DEFAULT '',
  proposal_template_id UUID,
  proposal_sent_at TIMESTAMPTZ,
  response_received_at TIMESTAMPTZ,
  contracted_at TIMESTAMPTZ,
  contract_value NUMERIC(10,2),
  estimated_hours NUMERIC(8,2),
  actual_hours NUMERIC(8,2),
  delivery_deadline TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  review_requested_at TIMESTAMPTZ,
  review_received_at TIMESTAMPTZ,
  review_rating NUMERIC(3,1),
  review_text TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunities_platform ON opportunities(platform_id);
CREATE INDEX idx_opportunities_pillar ON opportunities(pillar_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_created ON opportunities(created_at DESC);
