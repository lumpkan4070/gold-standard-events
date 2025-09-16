-- Fix security vulnerability: Secure contest entries containing personal information
-- This addresses the security issue where customer PII could be stolen

-- First, let's review current policies on contest_entries
-- Drop existing policies to rebuild them securely
DROP POLICY IF EXISTS "Anyone can submit contest entries" ON public.contest_entries;
DROP POLICY IF EXISTS "Only authenticated users can view contest entries" ON public.contest_entries;

-- Create secure policy for submissions - still allow public contest entry submissions
CREATE POLICY "Public can submit contest entries"
ON public.contest_entries
FOR INSERT
TO public
WITH CHECK (true);

-- Create admin-only access policy for viewing contest entries
-- Only users with admin role can view the personal information
CREATE POLICY "Only admins can view contest entries"
ON public.contest_entries
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create admin-only policy for managing contest entries
CREATE POLICY "Only admins can manage contest entries"
ON public.contest_entries
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create a secure view for contest analytics that doesn't expose PII
CREATE OR REPLACE VIEW public.contest_stats AS
SELECT 
  COUNT(*) as total_entries,
  COUNT(DISTINCT age_bracket) as unique_age_brackets,
  age_bracket,
  COUNT(*) as entries_per_age_bracket,
  DATE_TRUNC('day', submitted_at) as submission_date,
  COUNT(*) as daily_entries
FROM public.contest_entries
GROUP BY age_bracket, DATE_TRUNC('day', submitted_at)
ORDER BY submission_date DESC;

-- Grant limited access to contest stats (no PII exposed)
GRANT SELECT ON public.contest_stats TO authenticated;

-- Ensure no public access to raw contest entries table
REVOKE ALL ON public.contest_entries FROM anon;
REVOKE ALL ON public.contest_entries FROM public;

-- Only allow admins to access the raw table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_entries TO authenticated;