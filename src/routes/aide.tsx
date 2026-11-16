import { createFileRoute } from "@tanstack/react-router";
import { SupportContact, SupportForm } from "@/components/SupportForm";
import { LegalLinks } from "@/components/LegalPage";

const t = "Aide et assistance — Mes garanties";
const d = "Contactez le support de Mes garanties : assistance technique, abonnement, connexion ou réclamation.";
export const Route = createFileRoute("/aide")({
  head: () => ({ meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AidePage,
});

function AidePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="font-serif text-3xl">Aide et assistance</h1>
      <p className="mt-2 text-sm text-muted-foreground">Une question sur l’application, votre abonnement, la facturation ou une résiliation ? Écrivez-nous, nous répondons par e-mail.</p>
      <div className="mt-6 space-y-6"><SupportContact /><SupportForm /></div>
      <footer className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground"><LegalLinks /></footer>
    </main>
  );
}
