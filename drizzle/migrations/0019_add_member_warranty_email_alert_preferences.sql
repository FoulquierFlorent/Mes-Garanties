ALTER TABLE public.household_members
  ADD COLUMN email_alerts_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN email_alert_lead text NOT NULL DEFAULT '1m';

ALTER TABLE public.household_members
  ADD CONSTRAINT household_members_email_alert_lead_check
  CHECK (email_alert_lead IN ('6m', '3m', '1m', '1w'));