
ALTER TABLE public.pdf_signups
  ADD COLUMN IF NOT EXISTS confirmation_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Remove permissive insert policy; service role bypasses RLS and will handle writes.
DROP POLICY IF EXISTS "Anyone can sign up for the free PDF" ON public.pdf_signups;

-- Explicitly revoke direct INSERT from anon/authenticated; only service_role writes.
REVOKE INSERT, UPDATE, DELETE ON public.pdf_signups FROM anon, authenticated;
