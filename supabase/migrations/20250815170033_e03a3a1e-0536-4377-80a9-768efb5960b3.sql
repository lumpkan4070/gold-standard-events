-- Lock down analytics INSERT to authenticated users only
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can insert analytics" ON public.analytics;

CREATE POLICY "Authenticated users can insert analytics for themselves"
ON public.analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Restrict notifications visibility to authenticated users (remove public read)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view notifications" ON public.notifications;

CREATE POLICY "Authenticated users can view notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (true);
