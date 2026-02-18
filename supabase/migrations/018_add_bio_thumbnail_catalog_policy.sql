-- Migration 018: Phase 2 schema additions
-- Adds bio to tenants, thumbnail_url and contact_for_pricing to gig_listings,
-- drops NOT NULL on platform_id, and creates public anon RLS policy for gig_listings.

-- 1. Add bio column to tenants table (PROF-01)
ALTER TABLE tenants ADD COLUMN bio TEXT DEFAULT '';

-- 2. Add thumbnail_url column to gig_listings table (CATL-07)
ALTER TABLE gig_listings ADD COLUMN thumbnail_url TEXT DEFAULT '';

-- 3. Drop NOT NULL constraint on gig_listings.platform_id
--    Phase 2 services are platform-agnostic; existing rows retain their FK values.
ALTER TABLE gig_listings ALTER COLUMN platform_id DROP NOT NULL;

-- 4. Add contact_for_pricing boolean to gig_listings
--    Supports quote-based services alongside fixed-price for Phase 3 compatibility.
ALTER TABLE gig_listings ADD COLUMN contact_for_pricing BOOLEAN DEFAULT false;

-- 5. Create anon SELECT policy on gig_listings for the public catalog
--    Mirrors the tenants anon policy pattern from migration 015.
--    Only exposes services belonging to verified tenants with a public slug.
CREATE POLICY "Public can read services for verified tenants" ON gig_listings
  FOR SELECT TO anon
  USING (
    user_id IN (
      SELECT user_id FROM tenants
      WHERE slug IS NOT NULL AND onboarding_complete = true AND email_verified = true
    )
  );
