import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { RightBanner } from "@/components/RightBanner";
import { householdQuery, itemsQuery, fmt, todayISO } from "@/lib/items";
import { itemWarranties, status, WARRANTY_LABELS } from "@/lib/warranty";
import { memberDotClass, memberBorderClass } from "@/lib/members";

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
  const covered = own.filter((i) => itemWarranties(i).some((w) => status(w.end, today) !== "expired")).length;

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Link to="/foyer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Mon foyer
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <span aria-hidden className={`h-3.5 w-3.5 shrink-0 rounded-full ${memberDotClass(id)}`} />
        <h1 className="text-4xl sm:text-5xl">{name}</h1>
      </div>
      <RightBanner variant="whisper" offset={4} className="mt-3" />
      <p className="mt-3 text-muted-foreground">
        {own.length} objet{own.length > 1 ? "s" : ""} enregistré{own.length > 1 ? "s" : ""} · {covered} encore couvert{covered > 1 ? "s" : ""}.
      </p>

      {own.length ? (
        <ul className="mt-8 space-y-3">
          {own.map((i) => (
            <li key={i.id} className={`rounded-lg border-2 bg-card p-4 ${memberBorderClass(i.user_id)}`}>
              <Link to="/objet/$id" params={{ id: i.id }} className="block">
                <p className="font-serif text-xl">{i.name}{i.brand ? ` · ${i.brand}` : ""}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{i.category} · acheté le {fmt(i.purchase_date)}</p>
                <div className="mt-3 space-y-1">
                  {itemWarranties(i).map((w) => {
                    const s = status(w.end, today);
                    return (
                      <p key={w.key} className="text-xs">
                        <span className="font-medium">{WARRANTY_LABELS[w.key]}</span> — fin le {fmt(w.end)}
                        <span className="text-muted-foreground"> · {s === "expired" ? "expirée" : s === "soon" ? "bientôt finie" : "active"}</span>
                      </p>
                    );
                  })}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">Aucun objet enregistré pour ce membre pour le moment.</p>
          <Link to="/app" className="mt-4 inline-flex rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Ajouter un objet</Link>
        </div>
      )}
    </main>
  );
}
