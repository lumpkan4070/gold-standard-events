-- Add foreign key relationships for proper table joins

-- Add foreign key from profiles to auth.users
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key from user_roles to auth.users  
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key from event_bookings to auth.users
ALTER TABLE public.event_bookings
ADD CONSTRAINT event_bookings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key from photo_wall to auth.users
ALTER TABLE public.photo_wall
ADD CONSTRAINT photo_wall_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key from analytics to auth.users
ALTER TABLE public.analytics
ADD CONSTRAINT analytics_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key from admin_actions to auth.users
ALTER TABLE public.admin_actions
ADD CONSTRAINT admin_actions_admin_id_fkey
FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;