-- Make anthony@aclpublishing.com an admin user
-- First, we need to find the user_id for anthony@aclpublishing.com and insert admin role
-- Since we can't directly query auth.users, we'll create a function to do this safely

-- Insert admin role for anthony@aclpublishing.com
-- This will be done by finding the user through the profiles table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles 
WHERE email = 'anthony@aclpublishing.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_roles.user_id = profiles.user_id 
  AND role = 'admin'::app_role
);

-- Create admin management policies for user_roles table
-- Allow admins to insert new admin roles
CREATE POLICY "Admins can create admin roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND role = 'admin'::app_role
);