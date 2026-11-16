import { z } from "zod";

export const SUPPORT_EMAIL = "mesgaranties.support@gmail.com";

export const SUPPORT_CATEGORIES = [
  "Assistance technique",
  "Abonnement et facturation",
  "Problème de connexion",
  "Réclamation",
  "Autre demande",
] as const;

export const supportSchema = z.object({
  name: z.string().trim().min(1, "Indiquez votre nom").max(100),
  email: z.string().trim().email("Adresse e-mail invalide").max(255),
  category: z.enum(SUPPORT_CATEGORIES),
  subject: z.string().trim().min(3, "Sujet trop court").max(150),
  message: z.string().trim().min(10, "Message trop court (10 caractères minimum)").max(3000),
  website: z.string().max(0).optional(), // anti-spam (champ invisible)
});
export type SupportInput = z.infer<typeof supportSchema>;

/** Au plus 3 demandes par adresse e-mail sur une heure. */
export const SUPPORT_HOURLY_LIMIT = 3;
export function isSupportRateLimited(recentCount: number) {
  return recentCount >= SUPPORT_HOURLY_LIMIT;
}
