-- Enhance event_bookings table to include event title and image upload
ALTER TABLE public.event_bookings 
ADD COLUMN event_title TEXT,
ADD COLUMN event_image_url TEXT,
ADD COLUMN special_requests TEXT,
ADD COLUMN admin_notes TEXT,
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Create offers table for exclusive app-only offers
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  offer_type TEXT NOT NULL DEFAULT 'general', -- 'exclusive', 'vip', 'birthday', 'surprise'
  discount_percentage INTEGER,
  discount_amount DECIMAL(10,2),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create policies for offers
CREATE POLICY "Everyone can view active offers" 
ON public.offers 
FOR SELECT 
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can manage offers" 
ON public.offers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user_offers table to track user offer redemptions
CREATE TABLE public.user_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  offer_id UUID NOT NULL REFERENCES public.offers(id),
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, offer_id)
);

-- Enable RLS on user_offers
ALTER TABLE public.user_offers ENABLE ROW LEVEL SECURITY;

-- Create policies for user_offers
CREATE POLICY "Users can view their own offer redemptions" 
ON public.user_offers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem offers" 
ON public.user_offers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all offer redemptions" 
ON public.user_offers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create photo_wall table for guest experiences
CREATE TABLE public.photo_wall (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on photo_wall
ALTER TABLE public.photo_wall ENABLE ROW LEVEL SECURITY;

-- Create policies for photo_wall
CREATE POLICY "Everyone can view approved photos" 
ON public.photo_wall 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Users can upload their own photos" 
ON public.photo_wall 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own photos" 
ON public.photo_wall 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all photos" 
ON public.photo_wall 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create analytics table for tracking app usage
CREATE TABLE public.analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL, -- 'page_view', 'booking_created', 'offer_redeemed', 'photo_uploaded', etc.
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analytics
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics
CREATE POLICY "Admins can view all analytics" 
ON public.analytics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert analytics" 
ON public.analytics 
FOR INSERT 
WITH CHECK (true); -- Allow system to insert analytics

-- Enhance profiles table with birthday and anniversary tracking
ALTER TABLE public.profiles 
ADD COLUMN birthday DATE,
ADD COLUMN anniversary DATE,
ADD COLUMN preferences JSONB DEFAULT '{}',
ADD COLUMN vip_status BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN total_bookings INTEGER NOT NULL DEFAULT 0,
ADD COLUMN last_visit TIMESTAMP WITH TIME ZONE;

-- Create trigger to update booking counts
CREATE OR REPLACE FUNCTION update_profile_booking_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET total_bookings = total_bookings + 1 
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET total_bookings = total_bookings - 1 
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_count_trigger
  AFTER INSERT OR DELETE ON public.event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_booking_count();

-- Add trigger for updated_at column on offers table
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();