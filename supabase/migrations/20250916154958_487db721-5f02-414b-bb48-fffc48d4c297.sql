-- Fix Security Definer View issue detected by linter
-- Remove SECURITY DEFINER from views to use security invoker instead

-- Drop and recreate the contest_stats view without SECURITY DEFINER
DROP VIEW IF EXISTS public.contest_stats;

-- Recreate the view with SECURITY INVOKER (default behavior)
CREATE VIEW public.contest_stats AS
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

-- Explicitly set security invoker (uses querying user's permissions)
ALTER VIEW public.contest_stats SET (security_invoker = true);

-- Grant access to the view
GRANT SELECT ON public.contest_stats TO authenticated;

-- Fix any other views that might have security definer issues
-- Check and fix song_requests_public view
ALTER VIEW public.song_requests_public SET (security_invoker = true);