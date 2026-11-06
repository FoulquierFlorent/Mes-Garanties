CREATE TABLE public.household_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  email text NOT NULL,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_by uuid
);
GRANT SELECT, INSERT, UPDATE ON public.household_invitations TO authenticated;
GRANT ALL ON public.household_invitations TO service_role;
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family read invitations" ON public.household_invitations FOR SELECT TO authenticated
  USING (public.is_household_member(household_id, auth.uid()) AND EXISTS (SELECT 1 FROM public.households h WHERE h.id = household_id AND h.plan = 'famille'));
CREATE POLICY "family create invitations" ON public.household_invitations FOR INSERT TO authenticated
  WITH CHECK (invited_by = auth.uid() AND public.is_household_member(household_id, auth.uid()) AND EXISTS (SELECT 1 FROM public.households h WHERE h.id = household_id AND h.plan = 'famille'));
CREATE POLICY "family update invitations" ON public.household_invitations FOR UPDATE TO authenticated
  USING (public.is_household_member(household_id, auth.uid()) AND EXISTS (SELECT 1 FROM public.households h WHERE h.id = household_id AND h.plan = 'famille'))
  WITH CHECK (public.is_household_member(household_id, auth.uid()) AND EXISTS (SELECT 1 FROM public.households h WHERE h.id = household_id AND h.plan = 'famille'));

CREATE OR REPLACE FUNCTION public.accept_household_invitation(_token uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE invitation public.household_invitations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO invitation FROM public.household_invitations
    WHERE token = _token AND status = 'pending' AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'invitation_invalide'; END IF;
  IF lower(invitation.email) <> lower(coalesce(auth.jwt()->>'email', '')) THEN RAISE EXCEPTION 'email_different'; END IF;
  INSERT INTO public.household_members(household_id, user_id, email, display_name)
    VALUES (invitation.household_id, auth.uid(), auth.jwt()->>'email', split_part(auth.jwt()->>'email', '@', 1))
    ON CONFLICT DO NOTHING;
  UPDATE public.items SET household_id = invitation.household_id WHERE user_id = auth.uid() AND household_id IS NULL;
  UPDATE public.household_invitations SET status = 'accepted', accepted_by = auth.uid() WHERE id = invitation.id;
  RETURN invitation.household_id;
END $$;
REVOKE ALL ON FUNCTION public.accept_household_invitation(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.accept_household_invitation(uuid) TO authenticated;

CREATE POLICY "family members remove members" ON public.household_members FOR DELETE TO authenticated
  USING (user_id <> auth.uid() AND public.is_household_member(household_id, auth.uid()) AND EXISTS (SELECT 1 FROM public.households h WHERE h.id = household_id AND h.plan = 'famille'));

CREATE OR REPLACE FUNCTION public.enforce_family_item_attribution()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    IF NEW.household_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.households h WHERE h.id = NEW.household_id AND h.plan = 'famille') THEN
      RAISE EXCEPTION 'family_plan_required';
    END IF;
    IF NOT public.is_household_member(NEW.household_id, NEW.user_id) THEN
      RAISE EXCEPTION 'member_required';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS items_family_attribution ON public.items;
CREATE TRIGGER items_family_attribution BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.enforce_family_item_attribution();