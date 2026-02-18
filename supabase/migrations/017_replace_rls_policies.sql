-- Replace permissive USING(true) policies from 014_enable_rls.sql with user-scoped policies.
-- The old policy name (confirmed from 014_enable_rls.sql): "Allow all for authenticated users"
-- auth.uid() is wrapped in SELECT subquery for per-statement caching (not per-row), per Pattern 6.

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON platforms;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON service_pillars;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON gig_listings;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON opportunities;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON proposal_templates;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON projects;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON portfolio_items;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON revenue_entries;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON daily_metrics;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON content_blocks;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON gig_versions;

-- Create user-scoped policies for all 11 tables
-- Pattern: USING ((SELECT auth.uid()) = user_id) caches auth.uid() per-statement for performance

CREATE POLICY "Users can CRUD own rows" ON platforms
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own rows" ON service_pillars
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own rows" ON gig_listings
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own rows" ON opportunities
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own rows" ON proposal_templates
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own rows" ON projects
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own rows" ON portfolio_items
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own rows" ON revenue_entries
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own rows" ON daily_metrics
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own rows" ON content_blocks
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own rows" ON gig_versions
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
