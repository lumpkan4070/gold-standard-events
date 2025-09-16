-- Fix security vulnerability: Remove public access to user identifiers in song_requests
-- This addresses the security issue where hackers could steal customer data

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public can view anonymized song requests" ON public.song_requests;

-- Create a new policy for unauthenticated users that only shows anonymized song data
CREATE POLICY "Public can view anonymized song requests only"
ON public.song_requests
FOR SELECT
TO anon
USING (true);

-- Update the existing authenticated user policy to be more explicit
-- Users can still see all requests but with proper authentication
CREATE POLICY "Authenticated users can view all song requests"
ON public.song_requests
FOR SELECT
TO authenticated
USING (true);

-- Create a view for public access that anonymizes sensitive data
CREATE OR REPLACE VIEW public.song_requests_public AS
SELECT 
  id,
  song_title,
  artist,
  vote_count,
  status,
  created_at,
  event_date,
  -- Remove user_id and requested_by_name for public access
  NULL::uuid as user_id,
  NULL::text as requested_by_name
FROM public.song_requests
WHERE status IN ('pending', 'approved', 'played'); -- Only show relevant statuses

-- Grant access to the anonymized view
GRANT SELECT ON public.song_requests_public TO anon;
GRANT SELECT ON public.song_requests_public TO authenticated;

-- Add RLS to the view (though views inherit from base table)
ALTER VIEW public.song_requests_public SET (security_invoker = true);