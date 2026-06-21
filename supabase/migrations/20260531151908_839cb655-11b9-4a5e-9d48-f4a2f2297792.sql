DROP POLICY IF EXISTS "Authenticated users create own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Guests create registrations without user_id" ON public.registrations;

CREATE POLICY "Authenticated users create own registrations"
ON public.registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Guests create registrations without user_id"
ON public.registrations
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND status = 'pending');