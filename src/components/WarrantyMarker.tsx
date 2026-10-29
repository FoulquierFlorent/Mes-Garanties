export const WARRANTY_LEGEND = [
  { key: "base", label: "Garantie légale", className: "bg-warranty-legal" },
  { key: "store", label: "Garantie magasin", className: "bg-warranty-store" },
  { key: "brand", label: "Garantie de marque", className: "bg-warranty-brand" },
];

export function WarrantyMarker({ warrantyKey, className = "", title }: { warrantyKey: string; className?: string; title?: string }) {
  const warranty = WARRANTY_LEGEND.find((w) => w.key === warrantyKey);
  return <span aria-hidden="true" title={title} className={`inline-block h-1.5 w-6 shrink-0 rounded-sm ${warranty?.className ?? "bg-warranty-legal"} ${className}`} />;
}

export function ReminderMarker({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent ${className}`} />;
}