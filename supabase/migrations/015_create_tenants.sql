-- Create tenants table for multi-tenant foundation
-- This table stores tenant (user) profile data and links to auth.users

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  slug TEXT UNIQUE,
  tagline TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  email_verified BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_user_id ON tenants(user_id);

-- Trigger function: auto-create tenant row on auth.users insert
-- SECURITY DEFINER with empty search_path to avoid search_path injection attacks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.tenants (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger: fires after every new auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Row Level Security on tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read their own tenant row
CREATE POLICY "Users can read own tenant" ON tenants
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policy: authenticated users can update their own tenant row
CREATE POLICY "Users can update own tenant" ON tenants
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: public (anon) can read tenants that have completed onboarding and have a slug
-- Required for the public catalog route (/{slug})
CREATE POLICY "Public can read tenant by slug" ON tenants
  FOR SELECT TO anon
  USING (slug IS NOT NULL AND onboarding_complete = true);
