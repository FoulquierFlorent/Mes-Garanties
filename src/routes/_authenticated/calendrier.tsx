import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { itemsQuery, todayISO } from "@/lib/items";
import { ALERT_OPTIONS, alertDate, warrantyEnd, toISO, type AlertKey } from "@/lib/warranty";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/calendrier")({
  head: () => ({ meta: [{ title: "Calendrier — Garantia" }, { name: "description", content: "Calendrier de fin de vos garanties." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(itemsQuery),
  component: CalendarPage,
});

type Ev = { name: string; kind: "end" | AlertKey };

function CalendarPage() {
  const { data: items } = useSuspenseQuery(itemsQuery);
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const events = new Map<string, Ev[]>();
  const push = (d: string, e: Ev) => events.set(d, [...(events.get(d) ?? []), e]);
  items.forEach((i) => {
    const end = warrantyEnd(i.purchase_date, i.warranty_months);
    push(end, { name: i.name, kind: "end" });
    (i.alerts as AlertKey[]).forEach((a) => push(alertDate(end, a), { name: i.name, kind: a }));
  });

  const first = new Date(Date.UTC(ym.y, ym.m, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
  const cells = Array.from({ length: offset + days }, (_, k) => (k < offset ? null : toISO(new Date(Date.UTC(ym.y, ym.m, k - offset + 1)))));
  const shift = (d: number) => setYm(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }));
  const today = todayISO();
  const monthEvents = [...events.entries()].filter(([d]) => d.startsWith(`${ym.y}-${String(ym.m + 1).padStart(2, "0")}`)).sort();

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl capitalize sm:text-5xl">{first.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" })}</h1>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" aria-label="Mois précédent" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" aria-label="Mois suivant" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, k) => (
          <div key={k} className="bg-secondary p-2 text-center text-xs text-muted-foreground">{d}</div>
        ))}
        {cells.map((d, k) => {
          const ev = d ? events.get(d) ?? [] : [];
          return (
            <div key={k} className={`min-h-16 bg-card p-1.5 sm:min-h-20 ${d === today ? "ring-1 ring-inset ring-accent" : ""}`}>
              {d && <span className="text-xs text-muted-foreground">{Number(d.slice(8))}</span>}
              <div className="mt-1 flex flex-wrap gap-1">
                {ev.map((e, j) => (
                  <span key={j} title={e.name} className={`h-2 w-2 rounded-full ${e.kind === "end" ? "bg-destructive" : "bg-accent"}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8 space-y-2">
        {monthEvents.length === 0 && <p className="text-sm text-muted-foreground">Rien ce mois-ci.</p>}
        {monthEvents.flatMap(([d, evs]) => evs.map((e, j) => (
          <div key={d + j} className="flex items-center gap-3 text-sm">
            <span className={`h-2 w-2 rounded-full ${e.kind === "end" ? "bg-destructive" : "bg-accent"}`} />
            <span className="w-20 text-muted-foreground">{new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
            <span>{e.name} — {e.kind === "end" ? "fin de garantie" : `alerte ${ALERT_OPTIONS.find((o) => o.key === e.kind)?.label}`}</span>
          </div>
        )))}
      </div>
    </main>
  );
}
