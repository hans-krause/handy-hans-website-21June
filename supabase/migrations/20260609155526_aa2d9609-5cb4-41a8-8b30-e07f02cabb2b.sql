ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS class_slot_id text,
  ADD COLUMN IF NOT EXISTS class_day_label text;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS class_slot_id text,
  ADD COLUMN IF NOT EXISTS class_day_label text;