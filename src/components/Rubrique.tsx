import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type RubriqueProps = {
  title: string;
  hint?: string;
  badge?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  compact?: boolean;
  className?: string;
  contentClassName?: string;
};

/** Rubrique dépliable : le titre reste visible, le contenu n'apparaît qu'au clic. */
export function Rubrique({ title, hint, badge, open, onOpenChange, children, compact = false, className, contentClassName }: RubriqueProps) {
  return (
    <section className={cn(compact ? "" : "border-t", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-3 text-left",
          compact ? "rounded-md border px-3 py-2.5 text-sm hover:bg-muted" : "py-5 font-serif text-2xl",
        )}
      >
        <span className="flex flex-col">
          <span className={cn("flex items-center gap-2", compact && "font-medium")}>
            {title}
            {badge}
          </span>
          {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className={contentClassName}>{children}</div>}
    </section>
  );
}
