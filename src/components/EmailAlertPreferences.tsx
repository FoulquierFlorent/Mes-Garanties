import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_ALERT_OPTIONS, normalizeEmailAlertLead, type DEFAULT_EMAIL_ALERT_LEAD } from "@/lib/warranty-email";
import type { AlertKey } from "@/lib/warranty";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("household_members").update({ email_alert_lead: lead }).eq("household_id", householdId).eq("user_id", userId);
    setBusy(false);
    if (error) toast.error("Enregistrement impossible");
    else toast.success("Délai des alertes e-mail enregistré");
  }

  return (
    <section className="mt-6 rounded-lg border bg-card p-5" aria-labelledby="email-alert-title">
      <h2 id="email-alert-title" className="flex items-center gap-2 text-2xl"><Bell className="h-5 w-5 text-accent" />Alertes par e-mail</h2>
      <p className="mt-2 text-sm text-muted-foreground">Recevez un rappel pour les garanties des objets partagés par votre foyer, à l’adresse e-mail de votre compte.</p>
      <div className="mt-4 space-y-2">
        <Label htmlFor="email-alert-lead">Quand souhaitez-vous être prévenu ?</Label>
        <select id="email-alert-lead" value={lead} disabled={loading} onChange={(event) => setLead(event.target.value as AlertKey)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          {EMAIL_ALERT_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Un seul e-mail par objet regroupe les garanties concernées.</p>
      <Button className="mt-4" onClick={save} disabled={busy || loading}>{busy ? "Enregistrement…" : "Enregistrer mon délai"}</Button>
    </section>
  );
}
