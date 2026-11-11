import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { RightBanner } from "@/components/RightBanner";
import { householdQuery, itemsQuery, todayISO } from "@/lib/items";
import { itemWarranties, status } from "@/lib/warranty";
import { memberDotClass } from "@/lib/members";
import { ItemRow, StatTile } from "@/components/HouseholdUi";
import { PrivateProfile } from "@/components/PrivateProfile";
import { useUserId } from "@/hooks/useUserId";

export const Route = createFileRoute("/_authenticated/membre/$id")({
  head: () => ({ meta: [{ title: "Espace membre — Mes garanties" }, { name: "description", content: "L'espace d'un membre du foyer : ses objets et ses garanties." }, { property: "og:title", content: "Espace membre — Mes garanties" }, { property: "og:description", content: "Les objets et les garanties d'un membre du foyer." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(itemsQuery), context.queryClient.ensureQueryData(householdQuery)]),
  component: MemberSpace,
});

function MemberSpace() {
  const { id } = Route.useParams();
  const { data: items } = useSuspenseQuery(itemsQuery);
  const { data: h } = useSuspenseQuery(householdQuery);
  const member = h?.members.find((m) => m.user_id === id);
  const own = items.filter((i) => i.user_id === id);
  const today = todayISO();
  const name = member?.display_name?.trim() || "Membre";
  const me = useUserId();
  const isMe = me === id;
  const covered = own.filter((i) => itemWarranties(i).some((w) => status(w.end, today) !== "expired")).length;

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-5 sm:py-10">
      <Link to="/foyer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Mon foyer
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <span aria-hidden className={`h-3.5 w-3.5 shrink-0 rounded-full ${memberDotClass(id)}`} />
        <h1 className="text-4xl sm:text-5xl">{name}</h1>
      </div>
      <RightBanner variant="whisper" offset={4} className="mt-3" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatTile value={own.length} label={`objet${own.length > 1 ? "s" : ""} enregistré${own.length > 1 ? "s" : ""}`} />
        <StatTile value={covered} label="encore couverts" />
      </div>

      {isMe && (
        <section className="mt-5 rounded-xl border bg-card p-4">
          <h2 className="text-lg">Mes informations privées</h2>
          <div className="mt-2">{member?.display_name?.trim() ? <PrivateProfile userId={id} /> : <p className="text-sm text-muted-foreground">Enregistrez votre prénom dans la page Foyer pour ouvrir cet espace.</p>}</div>
        </section>
      )}
      <h2 className="mt-6 text-xl">Objets</h2>
      {own.length ? (
        <ul className="mt-2 space-y-2">{own.map((i) => <ItemRow key={i.id} item={i} today={today} />)}</ul>
      ) : (
        <div className="mt-2 rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Aucun objet enregistré pour ce membre pour le moment.</p>
          <Link to="/app" className="mt-3 inline-flex min-h-11 items-center rounded-md border px-3 text-sm hover:bg-muted">Ajouter un objet</Link>
        </div>
      )}
    </main>
  );
}
