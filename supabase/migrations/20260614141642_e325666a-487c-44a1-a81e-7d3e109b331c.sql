CREATE OR REPLACE FUNCTION public.count_active_class_subscribers(slot_id text, env text DEFAULT 'live')
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.subscriptions
  WHERE class_slot_id = slot_id
    AND environment = env
    AND (
      (status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now()))
      OR (status = 'canceled' AND current_period_end > now())
    );
$$;

GRANT EXECUTE ON FUNCTION public.count_active_class_subscribers(text, text) TO anon, authenticated, service_role;