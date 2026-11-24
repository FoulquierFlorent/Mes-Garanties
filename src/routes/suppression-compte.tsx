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

const TITLE = "Suppression de compte — Mes garanties";
const DESC = "Comment supprimer définitivement votre compte Mes garanties et vos données personnelles, avec ou sans connexion.";

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

function SuppressionComptePage() {
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
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
    setBusy(true);
    try {
      const detail = note.trim() || "Je demande la suppression définitive de mon compte Mes garanties et de mes données personnelles.";
      const res = await sendSupportRequest({
        data: {
          name: name.trim(),
          email: email.trim(),
          category: "Autre demande",
          subject: "Demande de suppression de compte",
          message: `Demande de suppression de compte pour l'adresse ${email.trim()}.\n\n${detail}`,
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
        Vous pouvez supprimer définitivement votre compte <strong>Mes garanties</strong> à tout moment, directement depuis l’application si vous êtes connecté, ou en envoyant une demande vérifiée depuis cette page publique.
      </p>

      <h2>1. Ce qui est supprimé et ce qui est conservé</h2>
      <ul>
        <li><strong>Supprimé immédiatement :</strong> votre compte, votre adresse e-mail, votre mot de passe, votre espace privé de profil, vos préférences d’alertes et vos objets personnels avec leurs photos, tickets et factures.</li>
        <li><strong>Objets partagés en foyer :</strong> si vous appartenez à un foyer comptant d’autres membres, les objets partagés et leurs justificatifs restent accessibles aux autres membres afin qu’ils conservent leurs garanties. Si vous êtes seul dans votre foyer, le foyer et tous ses objets sont supprimés.</li>
        <li><strong>Sauvegardes techniques :</strong> les copies de sauvegarde de l’infrastructure sont purgées sous 30 jours maximum.</li>
      </ul>

      <h2>2. Suppression immédiate (si vous êtes connecté)</h2>
      {signedInEmail ? (
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

      <h2>3. Demander la suppression sans connexion</h2>
      <p>
        Si vous n’avez plus accès à votre compte, utilisez le formulaire ci-dessous ou écrivez directement à{" "}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Demande%20de%20suppression%20de%20compte`} className="underline">{SUPPORT_EMAIL}</a>.
        Pour votre sécurité, nous vérifions votre identité par e-mail avant toute suppression manuelle ; aucun tiers ne peut supprimer un compte à votre place.
      </p>

      {sent ? (
        <div className="rounded-xl border bg-card p-5">
          <p className="font-medium">Demande bien enregistrée</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nous avons reçu votre demande de suppression pour <strong>{email}</strong>. Nous vous répondrons par e-mail pour confirmer votre identité puis finaliser la suppression sous 30 jours maximum (délai légal RGPD).
          </p>
        </div>
      ) : (
        <form onSubmit={submitRequest} className="space-y-4 rounded-xl border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="del-name">Nom ou prénom</Label>
            <Input id="del-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="del-email">Adresse e-mail du compte à supprimer</Label>
            <Input id="del-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.fr" className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="del-note">Précisions (facultatif)</Label>
            <Textarea id="del-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : je n'ai plus accès à l'application sur mon téléphone." />
          </div>
          <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="h-11">
            {busy ? "Envoi en cours…" : "Envoyer ma demande de suppression"}
          </Button>
        </form>
      )}
    </LegalPage>
  );
}