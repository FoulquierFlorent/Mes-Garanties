CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 6)),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.household_members (
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);
GRANT SELECT, UPDATE ON public.households TO authenticated;
GRANT SELECT, DELETE ON public.household_members TO authenticated;
GRANT ALL ON public.households TO service_role;
GRANT ALL ON public.household_members TO service_role;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_household_member(_hid uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.household_members WHERE household_id = _hid AND user_id = _uid)
$$;

CREATE POLICY "members read household" ON public.households FOR SELECT TO authenticated USING (public.is_household_member(id, auth.uid()));
CREATE POLICY "members rename household" ON public.households FOR UPDATE TO authenticated USING (public.is_household_member(id, auth.uid()));
CREATE POLICY "members read members" ON public.household_members FOR SELECT TO authenticated USING (public.is_household_member(household_id, auth.uid()));
CREATE POLICY "leave household" ON public.household_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_household(_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE hid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.households(name, created_by) VALUES (_name, auth.uid()) RETURNING id INTO hid;
  INSERT INTO public.household_members(household_id, user_id, email) VALUES (hid, auth.uid(), auth.jwt()->>'email');
  UPDATE public.items SET household_id = hid WHERE user_id = auth.uid() AND household_id IS NULL;
  RETURN hid;
END $$;

CREATE OR REPLACE FUNCTION public.join_household(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE hid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO hid FROM public.households WHERE invite_code = upper(trim(_code));
  IF hid IS NULL THEN RAISE EXCEPTION 'code invalide'; END IF;
  INSERT INTO public.household_members(household_id, user_id, email) VALUES (hid, auth.uid(), auth.jwt()->>'email') ON CONFLICT DO NOTHING;
  UPDATE public.items SET household_id = hid WHERE user_id = auth.uid() AND household_id IS NULL;
  RETURN hid;
END $$;

REVOKE EXECUTE ON FUNCTION public.create_household(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.join_household(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_household(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_household(text) TO authenticated;

ALTER TABLE public.items ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE SET NULL;
ALTER TABLE public.items ADD COLUMN category TEXT NOT NULL DEFAULT 'Autre';

DROP POLICY "own select" ON public.items;
DROP POLICY "own update" ON public.items;
DROP POLICY "own delete" ON public.items;
DROP POLICY "own insert" ON public.items;
CREATE POLICY "read own or household" ON public.items FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid())));
CREATE POLICY "insert own" ON public.items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (household_id IS NULL OR public.is_household_member(household_id, auth.uid())));
CREATE POLICY "update own or household" ON public.items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid())));
CREATE POLICY "delete own or household" ON public.items FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid())));