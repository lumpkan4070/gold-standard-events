-- Enable admins to delete users with proper cascade handling
-- First, ensure all user-related tables have ON DELETE CASCADE for user_id references

-- Update foreign key constraints to ensure proper cascading
-- Note: Some tables might already have the correct constraints

-- Create admin function to delete users safely
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
  
  -- Delete from auth.users (this will cascade to all related tables)
  DELETE FROM auth.users WHERE id = _user_id;
  
  -- Log the admin action
  INSERT INTO public.admin_actions (admin_id, action_type, target_id, description)
  VALUES (_admin_id, 'user_deleted', _user_id, 'User account deleted by admin');
END;
$$;

-- Create RLS policy to allow admins to delete users from profiles table
CREATE POLICY "Admins can delete user profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for user_roles deletion by admins
CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));