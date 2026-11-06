import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/invitation/$token")({
  head: () => ({ meta: [
    { title: "Invitation au foyer — Mes garanties" },
    { name: "description", content: "Acceptez votre invitation à partager les garanties du foyer." },
    { property: "og:title", content: "Invitation au foyer — Mes garanties" },
    { property: "og:description", content: "Rejoignez le foyer Mes garanties avec votre invitation sécurisée." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: InvitationPage,
});

function InvitationPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const accept = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        if (++attempts < 24) timer = setTimeout(accept, 500);
        else setError("La connexion n’a pas abouti. Rouvrez le lien reçu par e-mail.");
        return;
      }
      const { error: rpcError } = await supabase.rpc("accept_household_invitation", { _token: token });
      if (cancelled) return;
      if (rpcError) {
        setError(rpcError.message.includes("email_different") ? "Ce lien appartient à une autre adresse e-mail." : "Cette invitation est expirée, révoquée ou déjà utilisée.");
        return;
      }
      navigate({ to: "/calendrier", replace: true });
    };
    void accept();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [token, navigate]);

  return (
    <main className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="text-4xl">Invitation au foyer</h1>
      {error ? (
        <>
          <p className="mt-4 text-muted-foreground">{error}</p>
          <Button asChild className="mt-6"><Link to="/auth">Se connecter</Link></Button>
        </>
      ) : (
        <p role="status" className="mt-4 text-muted-foreground">Vérification de votre invitation et ouverture du foyer…</p>
      )}
    </main>
  );
}
