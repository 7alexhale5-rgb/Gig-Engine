CREATE TABLE proposal_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pillar_id UUID REFERENCES service_pillars(id) ON DELETE SET NULL,
  platform_id UUID REFERENCES platforms(id) ON DELETE SET NULL,
  template_text TEXT NOT NULL DEFAULT '',
  variables TEXT[] DEFAULT '{}',
  times_used INTEGER DEFAULT 0,
  times_won INTEGER DEFAULT 0,
  win_rate NUMERIC(5,4) GENERATED ALWAYS AS (
    CASE WHEN times_used > 0 THEN times_won::NUMERIC / times_used ELSE 0 END
  ) STORED,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposal_templates_pillar ON proposal_templates(pillar_id);
