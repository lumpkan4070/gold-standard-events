-- Update admin_delete_user to remove all user-linked data before deleting auth account
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid, _admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the requesting user is an admin
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Prevent self-deletion
  IF _user_id = _admin_id THEN
    RAISE EXCEPTION 'Admins cannot delete themselves';
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
$$;