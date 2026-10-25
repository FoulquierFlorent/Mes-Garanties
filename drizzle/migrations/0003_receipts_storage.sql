CREATE OR REPLACE FUNCTION public.can_access_item(_item uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.items i WHERE i.id = _item AND (i.user_id = _uid OR (i.household_id IS NOT NULL AND public.is_household_member(i.household_id, _uid))))
$$;
CREATE OR REPLACE FUNCTION public.safe_uuid(_t text) RETURNS uuid LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN RETURN _t::uuid; EXCEPTION WHEN others THEN RETURN NULL; END $$;

CREATE POLICY "receipts read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND public.can_access_item(public.safe_uuid((storage.foldername(name))[1]), auth.uid()));
CREATE POLICY "receipts insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND public.can_access_item(public.safe_uuid((storage.foldername(name))[1]), auth.uid()));
CREATE POLICY "receipts delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND public.can_access_item(public.safe_uuid((storage.foldername(name))[1]), auth.uid()));