import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendSupportRequest } from "@/lib/support.functions";
import { SUPPORT_CATEGORIES, SUPPORT_EMAIL, supportSchema } from "@/lib/support";

export function SupportForm({ defaultName = "", defaultEmail = "" }: { defaultName?: string; defaultEmail?: string }) {
  const send = useServerFn(sendSupportRequest);
  const [f, setF] = useState({ name: defaultName, email: defaultEmail, category: SUPPORT_CATEGORIES[0] as string, subject: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(f.subject || "Demande d'assistance")}&body=${encodeURIComponent(f.message)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = supportSchema.safeParse(f);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Formulaire incomplet."); return; }
    setState("sending");
    try {
      const r = await send({ data: parsed.data });
      if (r.sent) setState("sent"); else { setState("idle"); setError(r.error); }
    } catch { setState("idle"); setError("L’envoi a échoué. Écrivez-nous directement par e-mail."); }
  }

  if (state === "sent") return (
    <div role="status" className="rounded-xl border bg-card p-5 text-center">
      <CheckCircle2 className="mx-auto h-8 w-8 text-accent" />
      <p className="mt-2 font-medium">Votre demande a bien été envoyée.</p>
      <p className="mt-1 text-sm text-muted-foreground">Nous vous répondrons à {f.email}.</p>
      <Button variant="outline" className="mt-4 h-11" onClick={() => { setF({ ...f, subject: "", message: "" }); setState("idle"); }}>Nouvelle demande</Button>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-4 sm:p-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="s-name">Nom</Label><Input id="s-name" className="mt-1.5 h-11" value={f.name} onChange={set("name")} maxLength={100} autoComplete="name" /></div>
        <div><Label htmlFor="s-email">Adresse e-mail</Label><Input id="s-email" type="email" className="mt-1.5 h-11" value={f.email} onChange={set("email")} maxLength={255} autoComplete="email" /></div>
      </div>
      <div><Label htmlFor="s-cat">Catégorie</Label>
        <select id="s-cat" value={f.category} onChange={set("category")} className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
          {SUPPORT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div><Label htmlFor="s-subject">Sujet de la demande</Label><Input id="s-subject" className="mt-1.5 h-11" value={f.subject} onChange={set("subject")} maxLength={150} /></div>
      <div><Label htmlFor="s-msg">Message</Label><Textarea id="s-msg" rows={6} className="mt-1.5" value={f.message} onChange={set("message")} maxLength={3000} /></div>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.website} onChange={set("website")} />
      <p className="text-xs text-muted-foreground">N’indiquez jamais de mot de passe ni de coordonnées bancaires.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error} <a href={mailto} className="underline">Écrire à {SUPPORT_EMAIL}</a></p>}
      <Button type="submit" className="h-11 w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi…</> : "Envoyer ma demande"}
      </Button>
    </form>
  );
}

export function SupportContact() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="text-sm text-muted-foreground">Adresse du support</p><p className="break-all font-medium">{SUPPORT_EMAIL}</p></div>
      <Button asChild className="h-11 shrink-0"><a href={`mailto:${SUPPORT_EMAIL}`}><Mail className="mr-2 h-4 w-4" />Contacter le support</a></Button>
    </div>
  );
}
