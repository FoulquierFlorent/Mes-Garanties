REVOKE UPDATE ON public.households FROM authenticated;
GRANT UPDATE (name) ON public.households TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_client_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan AND current_user IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'plan_managed_server_side' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_client_plan_change ON public.households;
CREATE TRIGGER trg_prevent_client_plan_change
BEFORE UPDATE ON public.households
FOR EACH ROW
EXECUTE FUNCTION public.prevent_client_plan_change();