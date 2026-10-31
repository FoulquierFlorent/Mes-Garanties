import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Item = Tables<"items">;

export const itemsQuery = queryOptions({
  queryKey: ["items"],
  queryFn: async () => {
    const { data, error } = await supabase.from("items").select("*").order("purchase_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const fmt = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Catégories et types d’objets proposés (le type remplit le nom). */
export const CATEGORY_TYPES: Record<string, string[]> = {
  "Électronique": ["Smartphone", "Ordinateur portable", "Ordinateur fixe", "Tablette", "Liseuse", "Téléviseur", "Écran", "Appareil photo", "Caméra", "Casque", "Écouteurs", "Enceinte", "Montre connectée", "Imprimante", "Scanner"],
  "Électroménager": ["Réfrigérateur", "Congélateur", "Lave-linge", "Sèche-linge", "Lave-vaisselle", "Four", "Micro-ondes", "Plaque de cuisson", "Hotte", "Aspirateur", "Machine à café", "Climatiseur", "Radiateur"],
  "Cuisine": ["Robot cuisine", "Blender", "Grille-pain", "Bouilloire", "Friteuse", "Batterie de casseroles", "Couteaux"],
  "Meuble": ["Canapé", "Fauteuil", "Lit", "Matelas", "Table", "Bureau", "Chaise", "Armoire", "Dressing", "Bibliothèque", "Meuble de rangement"],
  "Maison & jardin": ["Tondeuse", "Taille-haie", "Barbecue", "Salon de jardin", "Luminaire", "Literie", "Alarme", "Robot piscine"],
  "Bricolage": ["Perceuse", "Visseuse", "Scie", "Ponceuse", "Nettoyeur haute pression", "Escabeau", "Caisse à outils"],
  "Mobilité": ["Voiture", "Moto", "Scooter", "Vélo", "Vélo électrique", "Trottinette électrique", "Camping-car", "Remorque", "Pièce auto"],
  "Sport": ["Tapis de course", "Vélo d’appartement", "Raquette", "Ski", "Chaussures de sport", "Montre GPS", "Tente"],
  "Enfant": ["Poussette", "Siège auto", "Lit bébé", "Chaise haute", "Babyphone", "Porte-bébé"],
  "Jeux": ["Console", "Manette", "Jeu vidéo", "Jeu de société", "Jouet", "Casque VR"],
  "Musique": ["Guitare", "Piano", "Platine vinyle", "Ampli", "Micro"],
  "Santé & beauté": ["Sèche-cheveux", "Lisseur", "Rasoir", "Brosse à dents électrique", "Tensiomètre", "Balance"],
  "Accessoires": ["Sac", "Valise", "Portefeuille", "Bijou", "Montre", "Lunettes"],
  "Vêtements": ["Manteau", "Chaussures", "Veste", "Pantalon"],
  "Animaux": ["Arbre à chat", "Fontaine", "Distributeur", "Niche"],
  "Bureau": ["Fauteuil de bureau", "Lampe de bureau", "Déchiqueteuse", "Calculatrice"],
  "Autre": [],
};
export const CATEGORIES = Object.keys(CATEGORY_TYPES);

export const householdQuery = queryOptions({
  queryKey: ["household"],
  queryFn: async () => {
    const { data: m, error } = await supabase.from("household_members").select("household_id, households(id, name, invite_code)").limit(1).maybeSingle();
    if (error) throw error;
    if (!m) return null;
    const { data: members } = await supabase.from("household_members").select("user_id, email, display_name").eq("household_id", m.household_id);
    return { ...(m.households as { id: string; name: string; invite_code: string }), members: members ?? [] };
  },
});

export const RETURN_LABELS: Record<string, string> = {
  none: "Aucun retour",
  preparing: "En préparation",
  sent: "Envoyé",
  repair: "En réparation",
  replaced: "Remplacé",
  refunded: "Remboursé",
  refused: "Refusé",
};
