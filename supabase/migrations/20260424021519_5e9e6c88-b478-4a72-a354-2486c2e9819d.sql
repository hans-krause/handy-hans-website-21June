
-- Allow guest bookings: make user_id nullable, capture guest contact info, allow public inserts
ALTER TABLE public.registrations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Anyone (including anonymous visitors) can create a registration
CREATE POLICY "Anyone can create registrations"
  ON public.registrations
  FOR INSERT
  WITH CHECK (true);
