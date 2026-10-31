import electronique from "@/assets/categories/electronique.jpg";
import electromenager from "@/assets/categories/electromenager.jpg";
import meuble from "@/assets/categories/meuble.jpg";
import sport from "@/assets/categories/sport.jpg";
import enfant from "@/assets/categories/enfant.jpg";
import jeux from "@/assets/categories/jeux.jpg";
import accessoires from "@/assets/categories/accessoires.jpg";
import vetements from "@/assets/categories/vetements.jpg";
import bricolage from "@/assets/categories/bricolage.jpg";
import autre from "@/assets/categories/autre.jpg";

const CATEGORY_IMAGES: Record<string, string> = {
  "Électronique": electronique,
  "Électroménager": electromenager,
  "Meuble": meuble,
  "Sport": sport,
  "Enfant": enfant,
  "Jeux": jeux,
  "Accessoires": accessoires,
  "Vêtements": vetements,
  "Bricolage": bricolage,
  "Autre": autre,
};

export function categoryImage(category: string): string | null {
  return CATEGORY_IMAGES[category] ?? null;
}
