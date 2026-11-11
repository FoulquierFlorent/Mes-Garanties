import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { itemWarranties, status, type Status } from "@/lib/warranty";
import { categoryImage } from "@/lib/category-images";
import { cn } from "@/lib/utils";

/** Petit indicateur chiffré (foyer, membre). */
export function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2.5 text-center">
      <p className="font-serif text-2xl leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

type Itemish = Parameters<typeof itemWarranties>[0] & { id: string; name: string; category: string };

/** Statut global d'un objet : la garantie qui court le plus longtemps. */
export function itemCoverage(item: Itemish, today: string): { end: string | null; status: Status | null } {
  const ends = itemWarranties(item).map((w) => w.end).sort();
  const end = ends.at(-1) ?? null;
  return { end, status: end ? status(end, today) : null };
}

const STATUS_TEXT: Record<Status, string> = { active: "Couvert", soon: "Bientôt expiré", expired: "Expiré" };
const STATUS_CLASS: Record<Status, string> = {
  active: "bg-success/10 text-success",
  soon: "bg-warning/10 text-warning",
  expired: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ value }: { value: Status }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_CLASS[value])}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />{STATUS_TEXT[value]}
    </span>
  );
}

const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** Ligne d'objet compacte : icône de catégorie, nom, fin de garantie, statut. */
export function ItemRow({ item, today }: { item: Itemish; today: string }) {
  const c = itemCoverage(item, today);
  const img = categoryImage(item.category);
  return (
    <li>
      <Link to="/objet/$id" params={{ id: item.id }} className="flex min-h-14 items-center gap-3 rounded-xl border bg-card px-3 py-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {img ? <img src={img} alt="" loading="lazy" width={36} height={36} className="h-9 w-9 shrink-0 rounded-lg object-cover" /> : <span aria-hidden className="h-9 w-9 shrink-0 rounded-lg bg-muted" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{item.name}</span>
          <span className="block text-xs text-muted-foreground">{c.end ? `Jusqu’au ${fmt(c.end)}` : "Pas de date de fin"}</span>
        </span>
        {c.status && <StatusBadge value={c.status} />}
      </Link>
    </li>
  );
}

/** Ligne de réglage dépliable, pour ne pas afficher tous les formulaires à la fois. */
export function SettingRow({ icon, title, hint, open, onToggle, children, tone }: { icon: ReactNode; title: string; hint?: string; open: boolean; onToggle: () => void; children: ReactNode; tone?: "danger" }) {
  return (
    <div className="border-b last:border-b-0">
      <button type="button" aria-expanded={open} onClick={onToggle} className={cn("flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", tone === "danger" && "text-destructive")}>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
        </span>
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
