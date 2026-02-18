-- Add user_id columns to all 11 existing tables for multi-tenant isolation.
-- Added as NULLABLE: existing rows have no user_id.
-- RLS policy USING (auth.uid() = user_id) naturally excludes NULL rows (NULL != any UUID).
-- DO NOT add NOT NULL here. DO NOT backfill — seeded data will be reassigned post-deploy.

ALTER TABLE platforms ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE service_pillars ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE gig_listings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE opportunities ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE proposal_templates ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE portfolio_items ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE revenue_entries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE daily_metrics ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE content_blocks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE gig_versions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index all user_id columns for RLS performance
CREATE INDEX idx_platforms_user_id ON platforms(user_id);
CREATE INDEX idx_service_pillars_user_id ON service_pillars(user_id);
CREATE INDEX idx_gig_listings_user_id ON gig_listings(user_id);
CREATE INDEX idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX idx_proposal_templates_user_id ON proposal_templates(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_portfolio_items_user_id ON portfolio_items(user_id);
CREATE INDEX idx_revenue_entries_user_id ON revenue_entries(user_id);
CREATE INDEX idx_daily_metrics_user_id ON daily_metrics(user_id);
CREATE INDEX idx_content_blocks_user_id ON content_blocks(user_id);
CREATE INDEX idx_gig_versions_user_id ON gig_versions(user_id);
