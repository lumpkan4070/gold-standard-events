-- Create storage bucket for photo wall if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'photo-wall', 'photo-wall', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'photo-wall'
);

-- Create storage policy for photo wall uploads
CREATE POLICY "Users can upload their own photos to photo-wall" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'photo-wall' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policy for viewing photo wall
CREATE POLICY "Photo wall images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'photo-wall');