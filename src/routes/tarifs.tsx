import { RightBanner } from "@/components/RightBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — Mes garanties" },
      { name: "description", content: "Commencez gratuitement. Les abonnements payants arrivent bientôt." },
      { property: "og:title", content: "Tarifs — Mes garanties" },
      { property: "og:description", content: "Commencez gratuitement. Les abonnements payants arrivent bientôt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tarifs,
});

type PlanSpec = {
  name: string;
  monthly?: string;
  yearly?: string;
  description: string;
  items: string[];
  cta: string;
  soon?: boolean;
  recommended?: boolean;
};

const PLANS: PlanSpec[] = [
  {
    name: "Gratuit",
    monthly: "0 €",
    description: "De quoi bien commencer, sans engagement.",
    items: ["5 objets", "Rappels simples", "1 export PDF par mois", "Scans limités"],
    cta: "Créer un compte",
  },
  {
    name: "Mes Garanties au Max",
    monthly: "1,99 €",
    yearly: "19,99 €",
    description: "Pour une personne qui veut réunir tous ses achats, factures et garanties au même endroit.",
    items: ["Objets illimités", "Scan factures", "Assistant SAV", "Exports PDF", "Dossier assurance simple"],
    cta: "Choisir au Max",
    soon: true,
    recommended: true,
  },
  {
    name: "Mes garanties Duo",
    monthly: "3,49 €",
    yearly: "34,99 €",
    description: "Pour deux personnes qui partagent un même espace pour suivre leurs achats et leurs garanties.",
    items: ["2 comptes reliés", "Objets partagés à deux", "Rappels pour les deux", "Scans illimités"],
    cta: "Choisir Duo",
    soon: true,
  },
  {
    name: "Mes Garan Team",
    monthly: "4,99 €",
    yearly: "49,99 €",
    description: "Pour les familles qui veulent rassembler les achats et les garanties de toute la maison.",
    items: ["Profils familiaux", "Biens par membre du foyer", "Filtres par profil", "Dossier assurance complet"],
    cta: "Choisir Team",
    soon: true,
  },
  {
    name: "Mes garanties Titane",
    monthly: "9,99 €",
    yearly: "99,99 €",
    description: "Pour les indépendants et les entrepreneurs qui suivent leur matériel professionnel.",
    items: ["Matériel professionnel", "Suivi garanties", "Historique réparations", "Dossier assurance pro"],
    cta: "Choisir Titane",
    soon: true,
  },
];

function Plan({ name, monthly, yearly, description, items, cta, soon, recommended }: PlanSpec) {
  return (
    <div className={`rounded-lg border bg-card p-8 ${recommended ? "border-accent/60 ring-1 ring-accent/30" : ""}`}>
      {recommended && <p className="text-xs uppercase tracking-[0.2em] text-accent">Recommandé</p>}
      <h2 className="text-3xl">{name}</h2>
      {monthly && <p className="mt-3 text-3xl font-semibold">{monthly}<span className="text-base font-normal text-muted-foreground"> / mois</span></p>}
      {yearly && <p className="text-sm text-muted-foreground">ou {yearly} / an</p>}
      <p className="mt-3 text-muted-foreground">{description}</p>
      <ul className="mt-6 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent" />{i}</li>
        ))}
      </ul>
      {soon ? (
        <Button className="mt-8 w-full" variant="outline" disabled>{cta} — bientôt</Button>
      ) : (
        <Button asChild className="mt-8 w-full"><Link to="/auth">{cta}</Link></Button>
      )}
    </div>
  );
}

function Tarifs() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-20">
      <h1 className="text-5xl">Tarifs</h1>
      <RightBanner variant="whisper" offset={4} className="mt-3" />
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Le plan Gratuit est accessible dès maintenant. Les abonnements payants arrivent bientôt.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((p) => <Plan key={p.name} {...p} />)}
      </div>
    </main>
  );
}
