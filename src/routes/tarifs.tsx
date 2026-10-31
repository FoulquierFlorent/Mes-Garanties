import { RightBanner } from "@/components/RightBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — Mes garanties" },
      { name: "description", content: "Commencez gratuitement. Un abonnement annuel arrive bientôt." },
      { property: "og:title", content: "Tarifs — Mes garanties" },
      { property: "og:description", content: "Commencez gratuitement. Un abonnement annuel arrive bientôt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tarifs,
});

function Plan({ name, price, items, cta, soon }: { name: string; price: string; items: string[]; cta: string; soon?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-8">
      <h2 className="text-3xl">{name}</h2>
      <p className="mt-2 text-muted-foreground">{price}</p>
      <ul className="mt-6 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i} className="flex gap-2"><Check className="h-4 w-4 text-accent" />{i}</li>
        ))}
      </ul>
      {soon ? (
        <Button className="mt-8 w-full" variant="outline" disabled>{cta}</Button>
      ) : (
        <Button asChild className="mt-8 w-full"><Link to="/auth">{cta}</Link></Button>
      )}
    </div>
  );
}

function Tarifs() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-20">
      <h1 className="text-5xl">Tarifs</h1>
      <RightBanner variant="whisper" offset={4} className="mt-3" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Plan name="Gratuit" price="0 €" items={["Objets illimités", "Calendrier des garanties", "Alertes personnalisables"]} cta="Créer un compte" />
        <Plan name="Annuel" price="Bientôt disponible" items={["Tout le plan gratuit", "Alertes par e-mail", "Support prioritaire"]} cta="Bientôt" soon />
      </div>
    </main>
  );
}
