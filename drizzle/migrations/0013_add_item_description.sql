ALTER TABLE public.items ADD COLUMN description text;
COMMENT ON COLUMN public.items.description IS 'Descriptif libre de l’objet, renseigné depuis sa fiche.';