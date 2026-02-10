-- Add missing foreign key constraint
ALTER TABLE opportunities
  ADD CONSTRAINT fk_opportunities_proposal_template
  FOREIGN KEY (proposal_template_id)
  REFERENCES proposal_templates(id)
  ON DELETE SET NULL;

-- Add missing indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_opportunities_gig_id ON opportunities(gig_id);
CREATE INDEX IF NOT EXISTS idx_proposal_templates_platform_id ON proposal_templates(platform_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_pillar_id ON portfolio_items(pillar_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_opportunity_id ON revenue_entries(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_category ON content_blocks(category);

-- Fix daily_metrics NULL upsert: UNIQUE constraint must treat NULL platform_id as equal
ALTER TABLE daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_date_platform_id_key;
ALTER TABLE daily_metrics
  ADD CONSTRAINT daily_metrics_date_platform_id_key
  UNIQUE NULLS NOT DISTINCT (date, platform_id);
