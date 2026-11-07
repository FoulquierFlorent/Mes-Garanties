import { alertDate, itemWarranties, type AlertKey, type WarrantyItem, type WarrantyKey } from "@/lib/warranty";

export const DEFAULT_EMAIL_ALERT_LEAD: AlertKey = "1m";

export const EMAIL_ALERT_OPTIONS: { key: AlertKey; label: string }[] = [
  { key: "6m", label: "6 mois avant l’échéance" },
  { key: "3m", label: "3 mois avant l’échéance" },
  { key: "1m", label: "1 mois avant l’échéance" },
  { key: "1w", label: "1 semaine avant l’échéance" },
];

export type EmailWarrantyItem = WarrantyItem & {
  id: string;
  name: string;
  household_id: string | null;
};

export type DueWarranty = { key: WarrantyKey; label: string; end: string };
export type DueItemWarrantyAlert = { itemId: string; itemName: string; warranties: DueWarranty[] };

export function normalizeEmailAlertLead(value: unknown): AlertKey {
  return EMAIL_ALERT_OPTIONS.some((option) => option.key === value) ? value as AlertKey : DEFAULT_EMAIL_ALERT_LEAD;
}

export function emailAlertLeadLabel(value: unknown): string {
  return EMAIL_ALERT_OPTIONS.find((option) => option.key === normalizeEmailAlertLead(value))!.label;
}

/** Regroupe dans un seul e-mail les garanties d’un objet dont le rappel arrive ce jour-là. */
export function dueWarrantyAlertsForItem(item: EmailWarrantyItem, lead: unknown, today: string): DueItemWarrantyAlert | null {
  const alertLead = normalizeEmailAlertLead(lead);
  const warranties = itemWarranties(item)
    .filter((warranty) => warranty.end >= today && alertDate(warranty.end, alertLead) === today)
    .map((warranty) => ({ key: warranty.key, label: warranty.label, end: warranty.end }));
  return warranties.length ? { itemId: item.id, itemName: item.name, warranties } : null;
}

export function dueWarrantyAlerts(items: EmailWarrantyItem[], lead: unknown, today: string): DueItemWarrantyAlert[] {
  return items.flatMap((item) => {
    const alert = dueWarrantyAlertsForItem(item, lead, today);
    return alert ? [alert] : [];
  });
}

/** Même membre, même objet, même délai et même jour : une seule demande d’envoi. */
export function warrantyEmailIdempotencyKey(userId: string, itemId: string, lead: unknown, today: string): string {
  return `warranty-expiration-${userId}-${itemId}-${normalizeEmailAlertLead(lead)}-${today}`;
}
