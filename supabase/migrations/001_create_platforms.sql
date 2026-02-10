CREATE TABLE platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  profile_url TEXT DEFAULT '',
  profile_status TEXT DEFAULT 'setup_needed' CHECK (profile_status IN ('setup_needed', 'application_pending', 'active', 'paused', 'planned')),
  headline TEXT DEFAULT '',
  overview_text TEXT DEFAULT '',
  hourly_rate NUMERIC(10,2),
  skills_tags TEXT[] DEFAULT '{}',
  specialized_profiles_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platforms_name ON platforms(name);
