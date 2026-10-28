import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WARRANTY_YEARS, yearsLabel } from "@/lib/warranty";
import { WarrantyMarker } from "@/components/WarrantyMarker";

export function WarrantyYearSelect({ id, label, value, onChange, optional = true, warrantyKey }: { id: string; label: string; value: number | null; onChange: (value: number | null) => void; optional?: boolean; warrantyKey?: string }) {
  return <div className="space-y-1.5">
    <Label htmlFor={id} className="flex flex-wrap items-center gap-2">{warrantyKey && <WarrantyMarker warrantyKey={warrantyKey} />}{label}</Label>
    <Select value={value === null ? "none" : String(value)} onValueChange={(v) => onChange(v === "none" ? null : Number(v))}>
      <SelectTrigger id={id}><SelectValue /></SelectTrigger>
      <SelectContent>{optional && <SelectItem value="none">Non renseignée</SelectItem>}{WARRANTY_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{yearsLabel(y)}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
}