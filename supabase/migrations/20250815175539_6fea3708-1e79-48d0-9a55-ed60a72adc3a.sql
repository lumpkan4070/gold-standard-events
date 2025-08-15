-- Create sample events for demonstration
INSERT INTO public.events (title, description, event_date, is_approved, created_by, featured_image_url)
VALUES 
  ('New Year VIP Party', 'Ring in the new year with style at Victory Bistro! Exclusive VIP packages available.', '2025-12-31 21:00:00+00', true, (SELECT user_id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'),
  ('Valentine''s Day Special', 'Romantic dinner for two with live music and special cocktails.', '2025-02-14 19:00:00+00', true, (SELECT user_id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400'),
  ('Spring Jazz Night', 'Live jazz performances every Thursday evening with signature cocktails.', '2025-03-20 20:00:00+00', true, (SELECT user_id FROM profiles LIMIT 1), 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400');

-- Create sample offers for demonstration
INSERT INTO public.offers (title, description, discount_percentage, offer_type, is_active, valid_from, valid_until, max_uses, created_by)
VALUES 
  ('Welcome Bonus', 'Get 20% off your first order when you sign up for our app!', 20, 'exclusive', true, NOW(), NOW() + INTERVAL '30 days', 100, (SELECT user_id FROM profiles LIMIT 1)),
  ('VIP Early Access', 'Exclusive 25% off for VIP members on all premium events.', 25, 'vip', true, NOW(), NOW() + INTERVAL '60 days', 50, (SELECT user_id FROM profiles LIMIT 1)),
  ('Birthday Special', 'Celebrate your birthday week with 30% off your entire table!', 30, 'birthday', true, NOW(), NOW() + INTERVAL '365 days', 200, (SELECT user_id FROM profiles LIMIT 1)),
  ('Flash Sale', 'Limited time surprise offer - 15% off selected menu items!', 15, 'surprise', true, NOW(), NOW() + INTERVAL '7 days', 75, (SELECT user_id FROM profiles LIMIT 1));

-- Create sample approved photos for photo wall
INSERT INTO public.photo_wall (image_url, caption, is_approved, user_id, approved_at, approved_by, likes_count)
VALUES 
  ('https://images.unsplash.com/photo-1544148103-0773bf10d330?w=300', 'Amazing cocktails at Victory Bistro!', true, (SELECT user_id FROM profiles LIMIT 1), NOW(), (SELECT user_id FROM profiles LIMIT 1), 15),
  ('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300', 'Perfect ambiance for a night out', true, (SELECT user_id FROM profiles LIMIT 1), NOW(), (SELECT user_id FROM profiles LIMIT 1), 8),
  ('https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300', 'Live music nights are incredible!', true, (SELECT user_id FROM profiles LIMIT 1), NOW(), (SELECT user_id FROM profiles LIMIT 1), 12),
  ('https://images.unsplash.com/photo-1574391884720-bbc0878f637b?w=300', 'Victory Bistro signature drinks', true, (SELECT user_id FROM profiles LIMIT 1), NOW(), (SELECT user_id FROM profiles LIMIT 1), 20);