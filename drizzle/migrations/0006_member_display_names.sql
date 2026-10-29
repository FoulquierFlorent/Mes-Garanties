alter table public.household_members add column if not exists display_name text;

update public.household_members set display_name = split_part(email, '@', 1) where display_name is null and email is not null;

GRANT SELECT, UPDATE ON public.household_members TO authenticated;
GRANT ALL ON public.household_members TO service_role;

create policy "members set own name" on public.household_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.create_household(_name text)
 returns uuid
 language plpgsql
 security definer
 set search_path = 'public'
as $function$
DECLARE hid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.households(name, created_by) VALUES (_name, auth.uid()) RETURNING id INTO hid;
  INSERT INTO public.household_members(household_id, user_id, email, display_name)
    VALUES (hid, auth.uid(), auth.jwt()->>'email', split_part(coalesce(auth.jwt()->>'email',''), '@', 1));
  UPDATE public.items SET household_id = hid WHERE user_id = auth.uid() AND household_id IS NULL;
  RETURN hid;
END $function$;

create or replace function public.join_household(_code text)
 returns uuid
 language plpgsql
 security definer
 set search_path = 'public'
as $function$
DECLARE hid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO hid FROM public.households WHERE invite_code = upper(trim(_code));
  IF hid IS NULL THEN RAISE EXCEPTION 'code invalide'; END IF;
  INSERT INTO public.household_members(household_id, user_id, email, display_name)
    VALUES (hid, auth.uid(), auth.jwt()->>'email', split_part(coalesce(auth.jwt()->>'email',''), '@', 1))
    ON CONFLICT DO NOTHING;
  UPDATE public.items SET household_id = hid WHERE user_id = auth.uid() AND household_id IS NULL;
  RETURN hid;
END $function$;