import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CATEGORIES, CATEGORY_TYPES } from "@/lib/items";
import { categoryImage } from "@/lib/category-images";

type Props = { category: string; onCategory: (c: string) => void; name: string; onType: (t: string) => void };

/** Sélecteur compact : recherche commune catégories / types, catégorie personnalisée possible. */
export function CategoryPicker({ category, onCategory, name, onType }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const needle = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!needle) return { cats: CATEGORIES, types: [] as { c: string; t: string }[] };
    const cats = CATEGORIES.filter((c) => c.toLowerCase().includes(needle));
    const types = CATEGORIES.flatMap((c) => (CATEGORY_TYPES[c] ?? []).filter((t) => t.toLowerCase().includes(needle)).map((t) => ({ c, t }))).slice(0, 8);
    return { cats, types };
  }, [needle]);
  const types = CATEGORY_TYPES[category] ?? [];
  const img = categoryImage(category);
  const choose = (c: string) => { onCategory(c); setOpen(false); setQ(""); };

  return (
    <div className="min-w-0 space-y-2">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="flex h-11 w-full items-center gap-2 rounded-md border bg-background px-3 text-left text-sm">
          {img && <img src={img} alt="" width={24} height={24} className="h-6 w-6 rounded object-cover" />}
          <span className="flex-1 truncate">{category}</span>
          <span className="text-xs text-muted-foreground">Changer</span>
        </button>
      ) : (
        <div className="rounded-md border bg-background p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus aria-label="Rechercher une catégorie" placeholder="Rechercher : lave-linge, vélo…" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 pl-8 pr-9" />
            <button type="button" aria-label="Fermer la recherche" onClick={() => { setOpen(false); setQ(""); }} className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-2 text-muted-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-2 max-h-56 overflow-y-auto">
            {results.types.map(({ c, t }) => (
              <button key={c + t} type="button" onClick={() => { choose(c); onType(t); }} className="flex w-full items-center justify-between rounded px-2 py-2.5 text-left text-sm hover:bg-muted">
                <span>{t}</span><span className="text-xs text-muted-foreground">{c}</span>
              </button>
            ))}
            {results.cats.map((c) => { const i = categoryImage(c); return (
              <button key={c} type="button" onClick={() => choose(c)} className={`flex w-full items-center gap-2 rounded px-2 py-2.5 text-left text-sm hover:bg-muted ${c === category ? "font-medium" : ""}`}>
                {i && <img src={i} alt="" loading="lazy" width={20} height={20} className="h-5 w-5 rounded object-cover" />}{c}
              </button>
            ); })}
            {needle && !CATEGORIES.some((c) => c.toLowerCase() === needle) && (
              <button type="button" onClick={() => choose(q.trim())} className="w-full rounded px-2 py-2.5 text-left text-sm text-primary hover:bg-muted">+ Créer la catégorie « {q.trim()} »</button>
            )}
          </div>
        </div>
      )}
      {!open && types.length > 0 && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Type d’objet">
          {types.map((t) => (
            <button key={t} type="button" onClick={() => onType(t)} className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${name === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{t}</button>
          ))}
        </div>
      )}
    </div>
  );
}
