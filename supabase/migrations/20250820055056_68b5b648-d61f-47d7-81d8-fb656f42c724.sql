-- Create enum for game prompt types
CREATE TYPE public.game_prompt_type AS ENUM ('truth', 'dare');

-- Create enum for prompt categories
CREATE TYPE public.prompt_category AS ENUM ('icebreakers', 'party_fun', 'memory_lane', 'victory_specials');

-- Create truth_prompts table
CREATE TABLE public.truth_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  category prompt_category NOT NULL DEFAULT 'icebreakers',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dare_prompts table
CREATE TABLE public.dare_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  category prompt_category NOT NULL DEFAULT 'icebreakers',
  is_active BOOLEAN NOT NULL DEFAULT true,
  points_reward INTEGER NOT NULL DEFAULT 10,
  offer_id UUID REFERENCES public.offers(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_game_activity table
CREATE TABLE public.user_game_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL,
  prompt_type game_prompt_type NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  shared_to_social BOOLEAN NOT NULL DEFAULT false,
  posted_to_photo_wall BOOLEAN NOT NULL DEFAULT false,
  completion_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.truth_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dare_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies for truth_prompts
CREATE POLICY "Everyone can view active truth prompts" 
ON public.truth_prompts 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage truth prompts" 
ON public.truth_prompts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for dare_prompts
CREATE POLICY "Everyone can view active dare prompts" 
ON public.dare_prompts 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage dare prompts" 
ON public.dare_prompts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user_game_activity
CREATE POLICY "Users can view their own game activity" 
ON public.user_game_activity 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game activity" 
ON public.user_game_activity 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game activity" 
ON public.user_game_activity 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all game activity" 
ON public.user_game_activity 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at columns
CREATE TRIGGER update_truth_prompts_updated_at
BEFORE UPDATE ON public.truth_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dare_prompts_updated_at
BEFORE UPDATE ON public.dare_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample truth prompts
INSERT INTO public.truth_prompts (text, category) VALUES
-- Icebreakers
('What''s the most embarrassing thing that happened to you at a restaurant?', 'icebreakers'),
('If you could have dinner with any celebrity, who would it be and why?', 'icebreakers'),
('What''s your most unusual food combination that you actually love?', 'icebreakers'),
('What''s the funniest thing you''ve ever seen at a party?', 'icebreakers'),
('If you had to eat only one cuisine for the rest of your life, what would it be?', 'icebreakers'),

-- Party Fun
('What''s the wildest adventure you''ve been on?', 'party_fun'),
('What''s your secret talent that surprises people?', 'party_fun'),
('What''s the most spontaneous thing you''ve ever done?', 'party_fun'),
('If you could switch lives with someone for a day, who would it be?', 'party_fun'),
('What''s your go-to karaoke song?', 'party_fun'),

-- Memory Lane
('What''s your favorite childhood memory involving food?', 'memory_lane'),
('What''s the best meal you''ve ever had and where was it?', 'memory_lane'),
('Tell us about your most memorable birthday celebration', 'memory_lane'),
('What''s a tradition from your family that you still follow?', 'memory_lane'),
('What''s the best advice someone has given you?', 'memory_lane'),

-- Victory Specials
('What''s your Victory Bistro order that friends always tease you about?', 'victory_specials'),
('If you could add one item to Victory Bistro''s menu, what would it be?', 'victory_specials'),
('What''s your favorite Victory Bistro memory?', 'victory_specials'),
('Which Victory Bistro dish would you recommend to a first-time visitor?', 'victory_specials'),
('What brought you to Victory Bistro for the first time?', 'victory_specials');

-- Insert sample dare prompts
INSERT INTO public.dare_prompts (text, category, points_reward) VALUES
-- Icebreakers
('Take a group selfie and show off your best "surprised" faces', 'icebreakers', 15),
('Do your best impression of your favorite movie character', 'icebreakers', 10),
('Tell a joke that will make the table laugh (or groan!)', 'icebreakers', 10),
('Share a fun fact about yourself that most people don''t know', 'icebreakers', 10),
('Do a 30-second happy dance right where you''re sitting', 'icebreakers', 15),

-- Party Fun
('Lead the table in a toast to friendship and good times', 'party_fun', 20),
('Take a creative photo of your meal and post it to Victory Moments', 'party_fun', 25),
('Start a compliment chain - give everyone at the table a genuine compliment', 'party_fun', 20),
('Do your best victory pose and hold it for 10 seconds', 'party_fun', 15),
('Share your best "that was awkward" story in 60 seconds or less', 'party_fun', 15),

-- Memory Lane
('Recreate a photo from your childhood using props from the table', 'memory_lane', 20),
('Tell the story of how you met your best friend at the table', 'memory_lane', 15),
('Share your most embarrassing fashion phase and own it with pride', 'memory_lane', 15),
('Do an impression of yourself from 10 years ago', 'memory_lane', 20),
('Share a childhood nickname and the story behind it', 'memory_lane', 10),

-- Victory Specials
('Take a photo with Victory Bistro staff and thank them for great service', 'victory_specials', 30),
('Create a mini food review of your current meal in 30 seconds', 'victory_specials', 20),
('Take a "behind the scenes" photo of your dining experience', 'victory_specials', 25),
('Lead a toast specifically to Victory Bistro and what makes it special', 'victory_specials', 25),
('Share why you love coming to Victory Bistro in exactly 7 words', 'victory_specials', 15);

-- Add victory points column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS victory_points INTEGER NOT NULL DEFAULT 0;

-- Create function to award victory points
CREATE OR REPLACE FUNCTION public.award_victory_points(user_uuid UUID, points INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET victory_points = victory_points + points 
  WHERE user_id = user_uuid;
END;
$$;