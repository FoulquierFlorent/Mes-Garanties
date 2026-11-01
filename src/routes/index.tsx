import { RightBanner } from "@/components/RightBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Bell, CalendarDays, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mes garanties — ne laissez plus expirer vos garanties" },
      { name: "description", content: "Enregistrez vos achats, suivez leur garantie dans un calendrier et soyez alerté 3 mois, 1 mois ou 1 semaine avant la fin." },
      { property: "og:title", content: "Mes garanties — ne laissez plus expirer vos garanties" },
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
        <RightBanner text="La garantie légale de conformité couvre vos achats pendant 2 ans : réparation ou remplacement gratuit." className="mt-10 max-w-xl" />
      </section>
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-3xl px-5 py-14">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Côté client</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">Une garantie, pour vous, c’est quoi&nbsp;?</h2>
          <p className="mt-5 text-lg">
            C’est le droit de ne pas payer deux fois le même objet. Quand un achat tombe en panne,
            se casse ou ne fonctionne plus, vous n’avez pas à racheter ni à payer la réparation :
            vous demandez au vendeur, à la marque ou au fabricant de réparer, de remplacer ou de rembourser.
          </p>
          <p className="mt-4 text-muted-foreground">
            Ce droit a une date de fin, et une preuve d’achat. C’est exactement ce que nous suivons pour vous :
            garantie légale, garantie magasin, garantie de marque, garantie constructeur, extension ou réparation.
            Tant que vous avez la date et la preuve, vous pouvez le faire valoir.
          </p>
          <RightBanner variant="whisper" offset={5} className="mt-6" />
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
        <div className="px-5">
          <RightBanner variant="whisper" offset={11} className="mx-auto my-6 max-w-3xl justify-center py-4" />
        </div>
      </section>
      <footer className="border-t py-10 text-center text-xs text-muted-foreground">© Mes garanties</footer>
    </main>
  );
}
