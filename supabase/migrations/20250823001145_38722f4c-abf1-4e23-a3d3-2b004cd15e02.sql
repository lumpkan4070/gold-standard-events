-- Create DJs table
CREATE TABLE public.djs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  genre_specialties TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create DJ ratings table
CREATE TABLE public.dj_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_id UUID NOT NULL REFERENCES public.djs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  performance_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dj_id, user_id, performance_date)
);

-- Create song requests table
CREATE TABLE public.song_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  song_title TEXT NOT NULL,
  artist TEXT NOT NULL,
  requested_by_name TEXT,
  vote_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'played', 'declined')),
  dj_id UUID REFERENCES public.djs(id),
  event_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create song votes table
CREATE TABLE public.song_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_request_id UUID NOT NULL REFERENCES public.song_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(song_request_id, user_id)
);

-- Enable RLS
ALTER TABLE public.djs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for DJs
CREATE POLICY "Everyone can view active DJs"
ON public.djs FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage DJs"
ON public.djs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for DJ Ratings
CREATE POLICY "Everyone can view DJ ratings"
ON public.dj_ratings FOR SELECT
USING (true);

CREATE POLICY "Users can create their own DJ ratings"
ON public.dj_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DJ ratings"
ON public.dj_ratings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all DJ ratings"
ON public.dj_ratings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for Song Requests
CREATE POLICY "Everyone can view song requests"
ON public.song_requests FOR SELECT
USING (true);

CREATE POLICY "Users can create song requests"
ON public.song_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own song requests"
ON public.song_requests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all song requests"
ON public.song_requests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for Song Votes
CREATE POLICY "Everyone can view song votes"
ON public.song_votes FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own votes"
ON public.song_votes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_djs_updated_at
  BEFORE UPDATE ON public.djs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_song_requests_updated_at
  BEFORE UPDATE ON public.song_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update DJ average rating
CREATE OR REPLACE FUNCTION update_dj_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.djs 
    SET 
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.dj_ratings 
        WHERE dj_id = NEW.dj_id
      ),
      total_ratings = (
        SELECT COUNT(*)
        FROM public.dj_ratings 
        WHERE dj_id = NEW.dj_id
      )
    WHERE id = NEW.dj_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.djs 
    SET 
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.dj_ratings 
        WHERE dj_id = OLD.dj_id
      ),
      total_ratings = (
        SELECT COUNT(*)
        FROM public.dj_ratings 
        WHERE dj_id = OLD.dj_id
      )
    WHERE id = OLD.dj_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update song request vote count
CREATE OR REPLACE FUNCTION update_song_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.song_requests 
    SET vote_count = vote_count + 1
    WHERE id = NEW.song_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.song_requests 
    SET vote_count = vote_count - 1
    WHERE id = OLD.song_request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_dj_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.dj_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_dj_average_rating();

CREATE TRIGGER trigger_update_song_vote_count
  AFTER INSERT OR DELETE ON public.song_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_song_vote_count();

-- Insert some sample DJs
INSERT INTO public.djs (name, bio, genre_specialties) VALUES
('DJ Spinmaster', 'Cleveland''s premier nightlife DJ with over 10 years of experience', ARRAY['Hip-Hop', 'R&B', 'Pop']),
('DJ Voltage', 'High-energy electronic music specialist', ARRAY['EDM', 'House', 'Techno']),
('DJ SoulVibes', 'Bringing the best in soul and R&B to Victory Lounge', ARRAY['Soul', 'R&B', 'Funk']);