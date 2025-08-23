-- Fix function security warnings by adding search_path parameter
CREATE OR REPLACE FUNCTION update_dj_average_rating()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION update_song_vote_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;