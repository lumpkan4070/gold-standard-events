-- CRITICAL SECURITY FIXES FOR VICTORY BISTRO APP

-- 1. Fix User Roles - Prevent Privilege Escalation
-- Drop existing permissive policies that allow users to manage their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can create admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create secure RLS policies for user_roles
CREATE POLICY "Users can view their own roles (read only)" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert any roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Secure Event Bookings - Protect Personal Data
-- Update event_bookings policies to be more restrictive
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.event_bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.event_bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.event_bookings;

-- Create secure policies for event_bookings
CREATE POLICY "Users can view only their own bookings" 
ON public.event_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings for themselves only" 
ON public.event_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own bookings" 
ON public.event_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage all bookings" 
ON public.event_bookings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Secure Song Votes - Protect User Privacy
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Everyone can view song votes" ON public.song_votes;
DROP POLICY IF EXISTS "Users can manage their own votes" ON public.song_votes;

-- Create privacy-focused policies
CREATE POLICY "Users can view only their own votes" 
ON public.song_votes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes" 
ON public.song_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.song_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.song_votes 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all votes for moderation" 
ON public.song_votes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Secure Analytics Data - Protect User Privacy
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert analytics for themselves" ON public.analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics;

-- Create privacy-focused analytics policies
CREATE POLICY "Users can insert their own analytics only" 
ON public.analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users cannot view analytics data" 
ON public.analytics 
FOR SELECT 
USING (false); -- No one can select except admins

CREATE POLICY "Only admins can view analytics data" 
ON public.analytics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Secure Admin Actions - Ensure proper audit trail
DROP POLICY IF EXISTS "Admins can create admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;

CREATE POLICY "Only admins can create admin actions for themselves" 
ON public.admin_actions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = admin_id);

CREATE POLICY "Only admins can view admin actions" 
ON public.admin_actions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Update Database Functions with Proper Security
-- Update the has_role function to be more secure
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update admin_delete_user function with better security
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid, _admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify the requesting user is an admin
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Prevent self-deletion
  IF _user_id = _admin_id THEN
    RAISE EXCEPTION 'Admins cannot delete themselves';
  END IF;

  -- Prevent deletion of other admins
  IF has_role(_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Cannot delete other admin users';
  END IF;

  -- Delete dependent data across public schema (privacy-first)
  DELETE FROM public.notification_recipients WHERE user_id = _user_id;
  DELETE FROM public.user_offers WHERE user_id = _user_id;
  DELETE FROM public.user_game_activity WHERE user_id = _user_id;
  DELETE FROM public.song_votes WHERE user_id = _user_id;
  DELETE FROM public.song_requests WHERE user_id = _user_id;
  DELETE FROM public.dj_ratings WHERE user_id = _user_id;
  DELETE FROM public.event_bookings WHERE user_id = _user_id;
  DELETE FROM public.photo_wall WHERE user_id = _user_id;
  DELETE FROM public.analytics WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE user_id = _user_id;

  -- Finally, delete the auth user (removes sign-in access)
  DELETE FROM auth.users WHERE id = _user_id;

  -- Log the admin action
  INSERT INTO public.admin_actions (admin_id, action_type, target_id, description)
  VALUES (_admin_id, 'user_deleted', _user_id, 'User account and related data deleted by admin');
END;
$function$;

-- Update other security-sensitive functions
CREATE OR REPLACE FUNCTION public.award_victory_points(user_uuid uuid, points integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Add validation to prevent negative points
  IF points < 0 THEN
    RAISE EXCEPTION 'Cannot award negative points';
  END IF;
  
  UPDATE public.profiles 
  SET victory_points = victory_points + points 
  WHERE user_id = user_uuid;
END;
$function$;

-- Secure the increment_offer_usage function
CREATE OR REPLACE FUNCTION public.increment_offer_usage(offer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Add validation to prevent unauthorized usage increments
  IF NOT EXISTS(SELECT 1 FROM public.offers WHERE id = offer_id AND is_active = true) THEN
    RAISE EXCEPTION 'Offer is not active or does not exist';
  END IF;
  
  UPDATE public.offers 
  SET current_uses = current_uses + 1 
  WHERE id = offer_id;
END;
$function$;

-- 7. Create secure role management function for admins only
CREATE OR REPLACE FUNCTION public.admin_assign_role(_user_id uuid, _role app_role, _admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify the requesting user is an admin
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;

  -- Insert the role (upsert pattern)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log the admin action
  INSERT INTO public.admin_actions (admin_id, action_type, target_id, description)
  VALUES (_admin_id, 'role_assigned', _user_id, 'Role ' || _role::text || ' assigned to user');
END;
$function$;