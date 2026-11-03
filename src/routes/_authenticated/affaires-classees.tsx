import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { itemsQuery, todayISO, fmt } from "@/lib/items";
import { isArchived } from "@/lib/deadlines";
import { itemWarranties } from "@/lib/warranty";
import { WarrantyMarker } from "@/components/WarrantyMarker";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/affaires-classees")({
  head: () => ({ meta: [{ title: "Affaires classées — Mes garanties" }, { name: "description", content: "Objets dont toutes les garanties sont expirées." }, { property: "og:title", content: "Affaires classées — Mes garanties" }, { property: "og:description", content: "Les objets du foyer dont toutes les garanties sont terminées." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(itemsQuery),
  component: ArchivePage,
});

function ArchivePage() {
  const { data } = useSuspenseQuery(itemsQuery);
  const today = todayISO();
  const items = data.filter((i) => isArchived(i, today));
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <Button asChild variant="outline" size="sm" className="rounded-full"><Link to="/app">← Objets</Link></Button>
      <h1 className="mt-6 text-4xl sm:text-5xl">Affaires classées</h1>
      <p className="mt-1 text-sm text-muted-foreground">Objets dont toutes les garanties sont expirées.</p>
      {items.length === 0 ? <p className="mt-12 text-center text-muted-foreground">Aucune affaire classée.</p> : (
        <ul className="mt-8 space-y-3">
          {items.map((i) => (
            <li key={i.id} className="rounded-lg border bg-card p-4">
              <Link to="/objet/$id" params={{ id: i.id }} className="font-medium hover:text-accent">{i.name}{i.brand && <span className="font-normal text-muted-foreground"> · {i.brand}</span>}</Link>
              <p className="text-xs uppercase tracking-wider text-accent">{i.category}</p>
              <div className="mt-2 space-y-1">
                {itemWarranties(i).map((w) => <p key={w.key} className="flex items-center gap-2 text-xs text-muted-foreground"><WarrantyMarker warrantyKey={w.key} />{w.label} — expirée le {fmt(w.end)}</p>)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
