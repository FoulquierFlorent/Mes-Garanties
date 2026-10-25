ALTER TABLE public.items ADD COLUMN return_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.items ADD COLUMN return_sent_date DATE;
ALTER TABLE public.items ADD COLUMN return_tracking TEXT;
ALTER TABLE public.items ADD COLUMN return_notes TEXT;