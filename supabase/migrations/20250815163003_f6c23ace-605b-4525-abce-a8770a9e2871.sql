-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);

-- Create storage policies for event images
CREATE POLICY "Users can upload event images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Event images are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-images');

CREATE POLICY "Users can update their own event images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can manage all event images" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'event-images' AND has_role(auth.uid(), 'admin'::app_role));