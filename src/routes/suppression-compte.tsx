import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { DeleteAccount } from "@/components/DeleteAccount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORT_EMAIL } from "@/lib/support";
import { sendSupportRequest } from "@/lib/support.functions";

const TITLE = "Suppression de compte et des données — Mes garanties";
const DESC = "Supprimez définitivement votre compte Mes garanties ou demandez la suppression de certaines données tout en conservant votre compte.";

export const Route = createFileRoute("/suppression-compte")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuppressionComptePage,
});

type DeletionScope = "account" | "partial";

function SuppressionComptePage() {
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [scope, setScope] = useState<DeletionScope>("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedInEmail(data.session?.user?.email ?? null);
    });
  }, []);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (scope === "partial" && note.trim().length < 5) {
      setError("Précisez quelles données vous souhaitez supprimer (objets, factures, photos, profil, carnet d’entretien…).");
      return;
    }
    setBusy(true);
    try {
      const isPartial = scope === "partial";
      const detail = note.trim() || "Je demande la suppression définitive de mon compte Mes garanties et de mes données personnelles.";
      const res = await sendSupportRequest({
        data: {
          name: name.trim(),
          email: email.trim(),
          category: "Autre demande",
          subject: isPartial ? "Demande de suppression partielle de données" : "Demande de suppression de compte",
          message: `${isPartial ? "Demande de suppression partielle (compte conservé)" : "Demande de suppression définitive du compte"} pour l'adresse ${email.trim()}.\n\nDonnées concernées / précisions :\n${detail}`,
          website,
        },
      });
      if (!res.sent) {
        setError(res.error ?? "L’envoi a échoué. Écrivez-nous directement par e-mail.");
        return;
      }
      setSent(true);
    } catch {
      setError("Vérifiez les champs saisis puis réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LegalPage title="Suppression de compte et des données">
      <p>
        Vous pouvez à tout moment choisir entre <strong>supprimer définitivement votre compte Mes garanties</strong> ou <strong>supprimer uniquement certaines de vos données tout en conservant votre compte</strong>, directement depuis l’application ou via cette page publique accessible sans connexion.
      </p>

      <h2>1. Choisir le type de suppression</h2>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Type de demande de suppression">
        <button
          type="button"
          role="radio"
          aria-checked={scope === "account"}
          onClick={() => { setScope("account"); setError(null); }}
          className={`rounded-xl border p-4 text-left transition-colors ${scope === "account" ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/40"}`}
        >
          <p className="font-medium">Supprimer définitivement mon compte et les données associées</p>
          <p className="mt-1 text-sm text-muted-foreground">Clôture définitive du compte, du profil privé et des objets personnels.</p>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={scope === "partial"}
          onClick={() => { setScope("partial"); setError(null); }}
          className={`rounded-xl border p-4 text-left transition-colors ${scope === "partial" ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/40"}`}
        >
          <p className="font-medium">Supprimer uniquement certaines de mes données en conservant mon compte</p>
          <p className="mt-1 text-sm text-muted-foreground">Effacement ciblé (factures, photos, objets, carnet d’entretien, profil) sans fermer le compte.</p>
        </button>
      </div>

      <h2>2. Données supprimées, données conservées et délais</h2>
      <ul>
        <li><strong>Suppression de compte :</strong> suppression immédiate du compte, de l’adresse e-mail, du mot de passe, du profil privé, des préférences d’alertes et de vos objets personnels avec leurs photos, tickets, factures, textes OCR et interventions du carnet d’entretien.</li>
        <li><strong>Suppression partielle :</strong> vous pouvez supprimer individuellement une photo ou un justificatif depuis la fiche d’un objet, un objet entier avec ses fichiers associés depuis la liste des objets, une intervention depuis le carnet d’entretien, ou demander un effacement ciblé via le formulaire ci-dessous tout en gardant votre compte actif.</li>
        <li><strong>Particularité du foyer partagé :</strong> si vous appartenez à un foyer comptant d’autres membres, les objets partagés du foyer et leurs justificatifs restent accessibles aux autres membres afin qu’ils ne perdent pas le suivi de leurs garanties. Si vous êtes seul dans votre foyer, le foyer et l’ensemble de ses objets et fichiers sont supprimés.</li>
        <li><strong>Délais de conservation réels :</strong> les données supprimées sont retirées immédiatement de l’application et du stockage actif. Les copies de sauvegarde techniques de l’infrastructure sont purgées sous 30 jours maximum. Les échanges liés au traitement de votre demande de support sont conservés jusqu’à 12 mois à des fins de suivi et de preuve de traitement.</li>
      </ul>

      <h2>3. Action directe dans l’application</h2>
      {scope === "partial" ? (
        <p>
          Si vous êtes connecté, vous pouvez supprimer immédiatement une photo ou une facture depuis la fiche de l’objet (bouton corbeille avec confirmation), supprimer un objet complet et ses fichiers depuis <Link to="/app" className="underline">Mes objets</Link>, ou supprimer une intervention depuis le <Link to="/carnet" className="underline">Carnet d’entretien</Link>.
        </p>
      ) : signedInEmail ? (
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Vous êtes actuellement connecté avec <strong>{signedInEmail}</strong>. Vous pouvez supprimer votre compte immédiatement ci-dessous ou depuis la page{" "}
            <Link to="/foyer" className="underline">Foyer</Link>.
          </p>
          <div className="mt-4">
            <DeleteAccount sharedItems={0} />
          </div>
        </div>
      ) : (
        <p>
          Connectez-vous à votre compte puis ouvrez <strong>Foyer &gt; Zone sensible &gt; Supprimer définitivement mon compte</strong>, ou{" "}
          <Link to="/auth" className="underline">connectez-vous ici</Link> pour supprimer votre compte immédiatement.
        </p>
      )}

      <h2>4. Envoyer une demande sans connexion (vérification d’identité)</h2>
      <p>
        Utilisez le formulaire ci-dessous (sans avoir besoin d’être connecté) ou écrivez directement à{" "}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Demande%20de%20suppression%20de%20donn%C3%A9es`} className="break-all underline">{SUPPORT_EMAIL}</a>.
        <strong> Vérification d’identité :</strong> avant toute exécution manuelle, nous vous envoyons un message de confirmation à l’adresse e-mail associée au compte afin de vérifier que vous êtes bien le titulaire. Aucun tiers ne peut demander la suppression de vos données à votre place.
      </p>

      {sent ? (
        <div className="rounded-xl border bg-card p-5">
          <p className="font-medium">Demande bien enregistrée</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nous avons reçu votre demande ({scope === "partial" ? "suppression partielle, compte conservé" : "suppression définitive du compte"}) pour <strong>{email}</strong>. Nous vous répondrons par e-mail pour vérifier votre identité puis exécuter votre demande dans le délai légal RGPD de 30 jours maximum.
          </p>
        </div>
      ) : (
        <form onSubmit={submitRequest} className="space-y-4 rounded-xl border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="del-name">Nom ou prénom</Label>
            <Input id="del-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="del-email">Adresse e-mail du compte concerné</Label>
            <Input id="del-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.fr" className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="del-note">
              {scope === "partial" ? "Données à supprimer (obligatoire)" : "Précisions (facultatif)"}
            </Label>
            <Textarea
              id="del-note"
              rows={3}
              required={scope === "partial"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                scope === "partial"
                  ? "Ex. : supprimer les factures et photos de mon lave-linge, ou effacer mon historique du carnet d’entretien tout en gardant mon compte."
                  : "Ex. : je n'ai plus accès à l'application sur mon téléphone."
              }
            />
          </div>
          <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="h-auto min-h-11 w-full whitespace-normal py-2.5 text-center sm:w-auto">
            {busy
              ? "Envoi en cours…"
              : scope === "partial"
                ? "Envoyer ma demande de suppression partielle"
                : "Envoyer ma demande de suppression de compte"}
          </Button>
        </form>
      )}
    </LegalPage>
  );
}