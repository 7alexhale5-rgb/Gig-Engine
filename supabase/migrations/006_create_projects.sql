CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  start_date DATE,
  target_delivery_date DATE,
  actual_delivery_date DATE,
  milestones_json JSONB DEFAULT '[]',
  checklist_json JSONB DEFAULT '[]',
  time_entries_json JSONB DEFAULT '[]',
  client_communication_log_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_opportunity ON projects(opportunity_id);
