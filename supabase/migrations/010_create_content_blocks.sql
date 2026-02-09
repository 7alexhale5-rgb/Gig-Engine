CREATE TABLE content_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('bio', 'credential', 'process', 'testimonial', 'case_study')),
  title TEXT NOT NULL,
  content_text TEXT NOT NULL DEFAULT '',
  platform_tags TEXT[] DEFAULT '{}',
  pillar_tags TEXT[] DEFAULT '{}',
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
