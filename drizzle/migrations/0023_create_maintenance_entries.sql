CREATE TABLE public.maintenance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL DEFAULT 'courant',
  title text NOT NULL,
  done_date date,
  next_date date,
  frequency_months integer,
  description text,
  provider text,
  by_professional boolean NOT NULL DEFAULT true,
  amount numeric,
  covered_amount numeric,
  parts text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX maintenance_entries_item_idx ON public.maintenance_entries(item_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_entries TO authenticated;
GRANT ALL ON public.maintenance_entries TO service_role;
ALTER TABLE public.maintenance_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maint read" ON public.maintenance_entries FOR SELECT TO authenticated USING (public.can_access_item(item_id, auth.uid()));
CREATE POLICY "maint insert" ON public.maintenance_entries FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.can_access_item(item_id, auth.uid()));
CREATE POLICY "maint update" ON public.maintenance_entries FOR UPDATE TO authenticated USING (public.can_access_item(item_id, auth.uid())) WITH CHECK (public.can_access_item(item_id, auth.uid()));
CREATE POLICY "maint delete" ON public.maintenance_entries FOR DELETE TO authenticated USING (public.can_access_item(item_id, auth.uid()));