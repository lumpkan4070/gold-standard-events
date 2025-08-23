-- Profanity trigger for song_requests
CREATE OR REPLACE FUNCTION public.prevent_profanity_in_song_requests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  banned_words text[] := ARRAY[
    'fuck','shit','bitch','asshole','dick','pussy','cunt','nigger','nigga','faggot','slut','whore','bastard','cock','motherfucker','bullshit','douche','twat'
  ];
  w text;
  lc_title text := lower(coalesce(NEW.song_title,''));
  lc_artist text := lower(coalesce(NEW.artist,''));
BEGIN
  FOREACH w IN ARRAY banned_words LOOP
    IF position(w in lc_title) > 0 OR position(w in lc_artist) > 0 THEN
      RAISE EXCEPTION 'Profanity is not allowed in song requests';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_song_requests_profanity ON public.song_requests;
CREATE TRIGGER trg_song_requests_profanity
BEFORE INSERT OR UPDATE ON public.song_requests
FOR EACH ROW EXECUTE FUNCTION public.prevent_profanity_in_song_requests();