-- Enable real-time for song_requests table
ALTER TABLE public.song_requests REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.song_requests;

-- Enable real-time for song_votes table  
ALTER TABLE public.song_votes REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.song_votes;