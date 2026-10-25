import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Bell, CalendarDays, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Garantia — ne laissez plus expirer vos garanties" },
      { name: "description", content: "Enregistrez vos achats, suivez leur garantie dans un calendrier et soyez alerté 3 mois, 1 mois ou 1 semaine avant la fin." },
      { property: "og:title", content: "Garantia — ne laissez plus expirer vos garanties" },
      { property: "og:description", content: "Suivi des garanties de vos objets avec calendrier et alertes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: ShieldCheck, title: "Tous vos objets", text: "Date d'achat, durée de garantie, magasin : tout au même endroit." },
  { icon: CalendarDays, title: "Un calendrier clair", text: "Visualisez d'un coup d'œil quand chaque garantie prend fin." },
  { icon: Bell, title: "Des alertes au choix", text: "3 mois, 1 mois ou 1 semaine avant — combinez-les librement." },
];

function Index() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-5 pt-20 pb-24 sm:pt-32">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Suivi de garanties</p>
        <h1 className="mt-6 max-w-3xl text-5xl leading-[1.05] sm:text-7xl">
          Vos garanties, <em className="text-accent">jamais oubliées</em>.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Enregistrez vos achats et recevez une alerte avant la fin de leur garantie. Simple, discret, efficace.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link to="/auth">Commencer gratuitement</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/tarifs">Voir les tarifs</Link></Button>
        </div>
      </section>
      <section className="border-t">
        <div className="mx-auto grid max-w-6xl gap-px bg-border sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="bg-background p-8 sm:p-10">
              <f.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-6 text-2xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t py-10 text-center text-xs text-muted-foreground">© Garantia</footer>
    </main>
  );
}
