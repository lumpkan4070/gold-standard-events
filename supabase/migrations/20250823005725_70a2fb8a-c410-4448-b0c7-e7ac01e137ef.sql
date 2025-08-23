-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily reset function to run every 6 hours
SELECT cron.schedule(
  'reset-content-every-6-hours',
  '0 */6 * * *', -- Every 6 hours at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://qbhqqqhvjvonbzfkyney.functions.supabase.co/reset-daily-content',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiaHFxcWh2anZvbmJ6Zmt5bmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNjgzMTAsImV4cCI6MjA3MDg0NDMxMH0.3hVWJQlrW6F4hktzU374wQVO_rdpxDyfwHK59W0BgI8"}'::jsonb,
        body:='{"timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);