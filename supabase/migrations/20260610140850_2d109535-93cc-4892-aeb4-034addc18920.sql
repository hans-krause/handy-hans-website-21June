
-- 1:1 bookings synced from Cal.com
CREATE TABLE public.one_on_one_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cal_booking_uid TEXT NOT NULL UNIQUE,
  cal_event_type_slug TEXT,
  product_kind TEXT NOT NULL DEFAULT 'single-1on1', -- 'single-1on1' or 'ten-pack'
  title TEXT,
  student_email TEXT NOT NULL,
  student_name TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | cancelled | rescheduled
  meeting_url TEXT,
  payment_status TEXT, -- 'paid' | 'unpaid' | null
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.one_on_one_bookings TO authenticated;
GRANT ALL ON public.one_on_one_bookings TO service_role;

ALTER TABLE public.one_on_one_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own 1:1 bookings"
  ON public.one_on_one_bookings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins see all 1:1 bookings"
  ON public.one_on_one_bookings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX ix_one_on_one_bookings_user ON public.one_on_one_bookings (user_id);
CREATE INDEX ix_one_on_one_bookings_email ON public.one_on_one_bookings (lower(student_email));
CREATE INDEX ix_one_on_one_bookings_starts_at ON public.one_on_one_bookings (starts_at);

CREATE TRIGGER trg_one_on_one_bookings_updated_at
  BEFORE UPDATE ON public.one_on_one_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-student progress doc (Google Doc)
CREATE TABLE public.student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_email TEXT NOT NULL UNIQUE,
  student_name TEXT,
  google_doc_id TEXT NOT NULL,
  google_doc_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.student_documents TO authenticated;
GRANT ALL ON public.student_documents TO service_role;

ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see their own document"
  ON public.student_documents FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins see all student documents"
  ON public.student_documents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX ix_student_documents_user ON public.student_documents (user_id);

CREATE TRIGGER trg_student_documents_updated_at
  BEFORE UPDATE ON public.student_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
