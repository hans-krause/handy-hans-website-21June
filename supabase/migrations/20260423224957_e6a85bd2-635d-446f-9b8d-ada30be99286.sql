CREATE TABLE public.pdf_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pdf_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can sign up for the free PDF"
  ON public.pdf_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);