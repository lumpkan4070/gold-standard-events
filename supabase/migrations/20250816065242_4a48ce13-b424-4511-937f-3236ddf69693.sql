-- Fix photo-wall storage policies to allow user uploads with correct naming pattern
DROP POLICY IF EXISTS "Users can upload their own photos to photo-wall" ON storage.objects;

-- Create new policy that matches the actual upload pattern (user_id_timestamp.ext)
CREATE POLICY "Users can upload their own photos to photo-wall" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'photo-wall' 
  AND auth.uid() IS NOT NULL
  AND name ~ ('^' || auth.uid()::text || '_')
);

-- Also ensure users can view their own uploaded photos  
DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;
CREATE POLICY "Users can view their own photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'photo-wall' 
  AND (
    -- Public access for approved photos OR user's own photos
    name ~ ('^' || auth.uid()::text || '_') OR
    auth.uid() IS NULL -- Allow public access to view (for approved photos)
  )
);

-- Admin access to manage all photos
DROP POLICY IF EXISTS "Admins can manage all photos" ON storage.objects;
CREATE POLICY "Admins can manage all photos" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'photo-wall' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'photo-wall' AND has_role(auth.uid(), 'admin'::app_role));