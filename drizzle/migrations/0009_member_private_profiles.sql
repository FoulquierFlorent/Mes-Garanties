CREATE TABLE public.member_profiles (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text,
  relation text,
  phone text,
  birth_date date,
  address text,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_profiles TO authenticated;
GRANT ALL ON public.member_profiles TO service_role;
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.member_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own profile insert" ON public.member_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own profile update" ON public.member_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own profile delete" ON public.member_profiles FOR DELETE TO authenticated USING (user_id = auth.uid());