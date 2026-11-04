import { RightBanner } from "@/components/RightBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";
import {
  INDIVIDUAL_PLANS,
  PRO_PLANS,
  bestSavingsPercent,
  formatEuro,
  savingsPercent,
  yearlySavings,
  type PlanSpec,
} from "@/lib/plans";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — Mes garanties" },
      {
        name: "description",
        content:
          "Gratuit, Solo 2,99 € par mois, Famille 4,99 € par mois, et Mes garanties Titane 9,99 € par mois pour les professionnels.",
      },
      {
        property: "og:title",
        content: "Tarifs — Mes garanties",
      },
      {
        property: "og:description",
        content:
          "Gratuit, Solo 2,99 € par mois, Famille 4,99 € par mois, et Mes garanties Titane 9,99 € par mois pour les professionnels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tarifs,
});

type Period = "monthly" | "yearly";

function PeriodToggle({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
      <div
        role="group"
        aria-label="Période de facturation"
        className="inline-flex rounded-full border bg-card p-1"
      >
        {(["monthly", "yearly"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => onChange(p)}
            className={`rounded-full px-5 py-2 text-sm transition-colors ${
              period === p
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p === "monthly" ? "Mensuel" : "Annuel"}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Paiement à l'année : jusqu'à {bestSavingsPercent()} % d'économies.
      </p>
    </div>
  );
}

function PlanCard({ plan, period }: { plan: PlanSpec; period: Period }) {
  const yearly = period === "yearly";
  return (
    <div
      className={`flex flex-col rounded-lg border bg-card p-8 ${
        plan.recommended ? "border-accent/60 ring-1 ring-accent/30" : ""
      }`}
    >
      {plan.recommended && (
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Recommandé</p>
      )}
      <h2 className="text-3xl">{plan.name}</h2>
      <p className="mt-3 text-muted-foreground">{plan.description}</p>

      <div className="mt-6">
        {plan.monthly === null ? (
          <p className="text-3xl font-semibold">
            0 €<span className="text-base font-normal text-muted-foreground"> pour toujours</span>
          </p>
        ) : (
          <>
            <p className="text-4xl font-semibold">
              {formatEuro(yearly ? (plan.yearly ?? 0) : plan.monthly)}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {yearly ? "an" : "mois"}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {yearly
                ? `soit ${formatEuro((plan.yearly ?? 0) / 12)} par mois`
                : `ou ${formatEuro(plan.yearly ?? 0)} par an`}
            </p>
            {yearly && (
              <p className="mt-3 inline-block rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
                Vous économisez {formatEuro(yearlySavings(plan))} ({savingsPercent(plan)} %)
              </p>
            )}
          </>
        )}
      </div>

      <ul className="mt-6 space-y-2 text-sm">
        {plan.items.map((i) => (
          <li key={i} className="flex gap-2">
            <Check className="h-4 w-4 shrink-0 text-accent" />
            {i}
          </li>
        ))}
      </ul>

      {plan.soon ? (
        <Button className="mt-8 w-full" variant="outline" disabled>
          {plan.cta} — bientôt
        </Button>
      ) : (
        <Button asChild className="mt-8 w-full">
          <Link to="/auth">{plan.cta}</Link>
        </Button>
      )}
    </div>
  );
}

function Tarifs() {
  const [period, setPeriod] = useState<Period>("monthly");

  return (
    <main className="mx-auto max-w-6xl px-5 py-20">
      <h1 className="text-5xl">Tarifs</h1>
      <RightBanner variant="whisper" offset={4} className="mt-3" />
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Le plan Gratuit est accessible dès maintenant. Les abonnements payants arrivent bientôt.
      </p>

      <PeriodToggle period={period} onChange={setPeriod} />

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {INDIVIDUAL_PLANS.map((p) => (
          <PlanCard key={p.name} plan={p} period={period} />
        ))}
      </div>

      <section className="mt-16 rounded-lg border bg-card/50 p-8">
        <h2 className="text-3xl">Pour les professionnels</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Une offre pensée pour le matériel de travail : factures exportables pour la comptabilité,
          inventaire du parc et dossier d'assurance prêt à envoyer.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {PRO_PLANS.map((p) => (
            <PlanCard key={p.name} plan={p} period={period} />
          ))}
          <ul className="grid gap-3 self-center text-sm sm:grid-cols-2">
            {PRO_PLANS.flatMap((p) => p.items).map((i) => (
              <li key={i} className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-accent" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
