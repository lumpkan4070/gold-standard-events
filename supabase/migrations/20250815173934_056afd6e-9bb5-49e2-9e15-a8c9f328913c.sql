-- Fix the search path security issue for increment_offer_usage function
CREATE OR REPLACE FUNCTION public.increment_offer_usage(offer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.offers 
  SET current_uses = current_uses + 1 
  WHERE id = offer_id;
END;
$$;