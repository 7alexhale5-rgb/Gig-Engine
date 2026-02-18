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
  ('Automation & Workflows', 'n8n, Make, and Zapier workflow builds. Business-process automation, data pipelines, and system integrations that eliminate manual tasks.', '#3B82F6', 1),
  ('AI Implementation', 'Custom AI assistants, chatbot implementations, RAG pipelines, and intelligent automation using OpenAI, Anthropic, and open-source LLMs.', '#8B5CF6', 2),
  ('System Architecture', 'CRM setup, GoHighLevel migrations, technical audits, system design, and infrastructure planning for agencies and small businesses.', '#10B981', 3),
  ('Web App Development', 'Custom reporting dashboards, landing pages, client portals, and web application MVPs built with Next.js and modern tooling.', '#F59E0B', 4),
  ('Strategy & Consulting', 'Process mapping, fractional CTO advisory, digital strategy, architecture reviews, and technical consulting services.', '#EF4444', 5);
