CREATE TABLE portfolio_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pillar_id UUID REFERENCES service_pillars(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  client_name TEXT DEFAULT '',
  problem_description TEXT DEFAULT '',
  solution_description TEXT DEFAULT '',
  results_description TEXT DEFAULT '',
  metrics_json JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  platforms_used_on TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
