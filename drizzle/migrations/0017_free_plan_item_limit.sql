CREATE OR REPLACE FUNCTION public.enforce_free_item_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _plan text; _count int;
BEGIN
  IF NEW.household_id IS NOT NULL THEN
    SELECT plan INTO _plan FROM public.households WHERE id = NEW.household_id;
    SELECT count(*) INTO _count FROM public.items WHERE household_id = NEW.household_id;
  ELSE
    _plan := 'gratuit';
    SELECT count(*) INTO _count FROM public.items WHERE household_id IS NULL AND user_id = NEW.user_id;
  END IF;
  IF coalesce(_plan, 'gratuit') = 'gratuit' AND _count >= 5 THEN
    RAISE EXCEPTION 'free_plan_limit' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS items_free_limit ON public.items;
CREATE TRIGGER items_free_limit BEFORE INSERT ON public.items FOR EACH ROW EXECUTE FUNCTION public.enforce_free_item_limit();