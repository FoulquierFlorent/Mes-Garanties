import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_ALERT_OPTIONS, normalizeEmailAlertLead } from "@/lib/warranty-email";
import type { AlertKey } from "@/lib/warranty";
import { Label } from "@/components/ui/label";
import { TestEmailButton } from "@/components/TestEmailButton";
import { SENDER_EMAIL } from "@/lib/email-sender";

export function EmailAlertPreferences({ householdId, userId }: { householdId: string; userId: string }) {
  const [lead, setLead] = useState<AlertKey>("1m");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.from("household_members").select("email_alert_lead").eq("household_id", householdId).eq("user_id", userId).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error("Impossible de charger votre délai d’alerte");
        if (data) setLead(normalizeEmailAlertLead(data.email_alert_lead));
        setLoading(false);
      });
    return () => { active = false; };
  }, [householdId, userId]);

  async function save(next: AlertKey) {
    const prev = lead;
    setLead(next);
    setBusy(true);
    const { error } = await supabase.from("household_members").update({ email_alert_lead: next }).eq("household_id", householdId).eq("user_id", userId);
    setBusy(false);
    if (error) { setLead(prev); toast.error("Enregistrement impossible, réessayez"); }
    else toast.success("Délai de rappel enregistré");
  }

  return (
    <div aria-labelledby="email-alert-title">
      <h3 id="email-alert-title" className="sr-only">Alertes de garantie</h3>
      <p className="text-sm text-muted-foreground">Un e-mail par objet, envoyé depuis <span className="font-medium text-foreground">{SENDER_EMAIL}</span> à l’adresse de votre compte.</p>
      <div className="mt-3 space-y-1.5">
        <Label htmlFor="email-alert-lead">Me prévenir</Label>
        <select id="email-alert-lead" value={lead} disabled={loading || busy} onChange={(event) => save(event.target.value as AlertKey)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
          {EMAIL_ALERT_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
        <p className="text-xs text-muted-foreground" aria-live="polite">{busy ? "Enregistrement…" : "Enregistré automatiquement."}</p>
      </div>
      <TestEmailButton />
    </div>
  );
}
