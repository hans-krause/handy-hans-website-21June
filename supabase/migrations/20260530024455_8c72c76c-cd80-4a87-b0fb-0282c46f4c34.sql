DROP POLICY IF EXISTS "Anyone can create registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users create own registrations" ON public.registrations;

CREATE POLICY "Authenticated users create own registrations"
ON public.registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guests create registrations without user_id"
ON public.registrations
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);