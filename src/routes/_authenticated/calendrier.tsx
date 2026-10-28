import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight, Bell } from "lucide-react";
import { itemsQuery, todayISO, fmt } from "@/lib/items";
import { ALERT_OPTIONS, alertDate, itemWarranties, toISO, type AlertKey } from "@/lib/warranty";
import { Button } from "@/components/ui/button";
import { WarrantyMarker, WARRANTY_LEGEND } from "@/components/WarrantyMarker";

export const Route = createFileRoute("/_authenticated/calendrier")({
  head: () => ({ meta: [{ title: "Calendrier des garanties — Garantia" }, { name: "description", content: "Retrouvez les fins de garantie et les alertes des objets de votre foyer." }, { property: "og:title", content: "Calendrier des garanties — Garantia" }, { property: "og:description", content: "Retrouvez les fins de garantie et les alertes des objets de votre foyer." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(itemsQuery),
  component: CalendarPage,
});

type Ev = { id: string; name: string; warranty: string; warrantyKey: string; kind: "end" | AlertKey };

function CalendarPage() {
  const { data: items } = useSuspenseQuery(itemsQuery);
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(true);
  const events = new Map<string, Ev[]>();
  const push = (d: string, e: Ev) => events.set(d, [...(events.get(d) ?? []), e]);
  items.forEach((i) => {
    itemWarranties(i).forEach((w) => {
      const warranty = WARRANTY_LEGEND.find((entry) => entry.key === w.key)?.label ?? w.label;
      push(w.end, { id: i.id, name: i.name, warranty, warrantyKey: w.key, kind: "end" });
      if (showAlerts) (i.alerts as AlertKey[]).forEach((a) => push(alertDate(w.end, a), { id: i.id, name: i.name, warranty, warrantyKey: w.key, kind: a }));
    });
  });

  const first = new Date(Date.UTC(ym.y, ym.m, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
  const cells = Array.from({ length: offset + days }, (_, k) => (k < offset ? null : toISO(new Date(Date.UTC(ym.y, ym.m, k - offset + 1)))));
  const shift = (d: number) => { setSelected(null); setYm(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 })); };
  const today = todayISO();
  const monthEvents = [...events.entries()].filter(([d]) => d.startsWith(`${ym.y}-${String(ym.m + 1).padStart(2, "0")}`)).sort();
  const visibleEvents = selected ? monthEvents.filter(([d]) => d === selected) : monthEvents;

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-4xl sm:text-5xl">Calendrier des garanties</h1>
      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-2xl capitalize sm:text-3xl">{first.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" })}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" aria-label="Mois précédent" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" aria-label="Mois suivant" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        <Button variant="outline" size="sm" onClick={() => { setYm({ y: now.getFullYear(), m: now.getMonth() }); setSelected(null); }}>Aujourd’hui</Button>
        {WARRANTY_LEGEND.map((w) => <span key={w.key} className="flex items-center gap-1.5"><WarrantyMarker warrantyKey={w.key} />{w.label}</span>)}
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={showAlerts} onChange={(e) => setShowAlerts(e.target.checked)} className="accent-accent" /><Bell className="h-3 w-3 text-muted-foreground" />Alertes</label>
      </div>
      <div className="mt-8 grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, k) => (
          <div key={k} className="bg-secondary p-2 text-center text-xs text-muted-foreground">{d}</div>
        ))}
        {cells.map((d, k) => {
          const ev = d ? events.get(d) ?? [] : [];
          return (
            d ? <Button key={k} variant="ghost" aria-label={`${fmt(d)}, ${ev.length} événement(s)`} aria-pressed={selected === d} onClick={() => setSelected(selected === d ? null : d)} className={`h-16 min-w-0 flex-col items-start justify-start gap-0 rounded-none bg-card p-1.5 sm:h-20 ${selected === d ? "bg-secondary ring-2 ring-inset ring-primary" : d === today ? "ring-1 ring-inset ring-accent" : ""}`}>
              <span className="text-xs text-muted-foreground">{Number(d.slice(8))}</span>
              <div className="mt-1 flex w-full flex-col gap-1">
                {WARRANTY_LEGEND.map((w) => {
                  const ends = ev.filter((e) => e.warrantyKey === w.key && e.kind === "end");
                  return ends.length > 0 ? <WarrantyMarker key={w.key} warrantyKey={w.key} className="w-full" title={ends.map((e) => `${e.name} · ${e.warranty}`).join("\n")} /> : null;
                })}
              </div>
              {ev.some((e) => e.kind !== "end") && <Bell aria-label="Alertes" className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />}
            </Button> : <div key={k} className="h-16 bg-card sm:h-20" />
          );
        })}
      </div>
      <div className="mt-8 space-y-2">
        <div className="flex items-center justify-between gap-3"><h2 className="text-2xl">{selected ? fmt(selected) : "Échéances du mois"}</h2>{selected && <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Tout le mois</Button>}</div>
        {visibleEvents.length === 0 && <p className="text-sm text-muted-foreground">{selected ? "Aucune échéance ce jour." : "Aucune échéance ce mois-ci."}</p>}
        {visibleEvents.flatMap(([d, evs]) => evs.map((e, j) => (
          <Link to="/objet/$id" params={{ id: e.id }} key={d + j} className="flex items-center gap-3 border-b py-3 text-sm hover:text-accent">
            <WarrantyMarker warrantyKey={e.warrantyKey} />
            <span className="w-16 shrink-0 text-muted-foreground">{new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
            <span className="min-w-0 flex-1 break-words">{e.name}<span className="block text-xs text-muted-foreground">{e.warranty} · {e.kind === "end" ? "Fin de garantie" : `Alerte ${ALERT_OPTIONS.find((o) => o.key === e.kind)?.label}`}</span></span><ArrowUpRight className="h-4 w-4 shrink-0" />
          </Link>
        )))}
      </div>
    </main>
  );
}
