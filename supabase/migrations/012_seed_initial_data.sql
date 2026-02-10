-- Seed platforms
INSERT INTO platforms (name, profile_status) VALUES
  ('Upwork', 'active'),
  ('Fiverr', 'active'),
  ('Toptal', 'application_pending'),
  ('Arc.dev', 'application_pending'),
  ('PeoplePerHour', 'setup_needed'),
  ('Guru', 'setup_needed'),
  ('LinkedIn Services', 'planned'),
  ('Direct/Referral', 'active');

-- Seed service pillars
INSERT INTO service_pillars (name, description, color, sort_order) VALUES
  ('Web Development', 'Full-stack web development services including React, Next.js, Node.js, and modern web technologies.', '#3B82F6', 1),
  ('AI & Automation', 'AI-powered solutions, workflow automation, chatbots, and intelligent integrations.', '#8B5CF6', 2),
  ('Data & Analytics', 'Data pipelines, dashboards, visualization, and business intelligence solutions.', '#10B981', 3),
  ('Design & UX', 'User experience design, UI design, prototyping, and design system creation.', '#F59E0B', 4),
  ('Strategy & Consulting', 'Technical consulting, architecture reviews, digital strategy, and advisory services.', '#EF4444', 5);
