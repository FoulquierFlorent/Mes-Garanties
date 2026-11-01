import electronique from "@/assets/categories/electronique.jpg";
import electromenager from "@/assets/categories/electromenager.jpg";
import cuisine from "@/assets/categories/cuisine.jpg";
import meuble from "@/assets/categories/meuble.jpg";
import maisonJardin from "@/assets/categories/maison-jardin.jpg";
import bricolage from "@/assets/categories/bricolage.jpg";
import mobilite from "@/assets/categories/mobilite.jpg";
import sport from "@/assets/categories/sport.jpg";
import enfant from "@/assets/categories/enfant.jpg";
import jeux from "@/assets/categories/jeux.jpg";
import musique from "@/assets/categories/musique.jpg";
import santeBeaute from "@/assets/categories/sante-beaute.jpg";
import accessoires from "@/assets/categories/accessoires.jpg";
import vetements from "@/assets/categories/vetements.jpg";
import animaux from "@/assets/categories/animaux.jpg";
import bureau from "@/assets/categories/bureau.jpg";
import autre from "@/assets/categories/autre.jpg";

const CATEGORY_IMAGES: Record<string, string> = {
  "Électronique": electronique,
  "Électroménager": electromenager,
  "Cuisine": cuisine,
  "Meuble": meuble,
  "Maison & jardin": maisonJardin,
  "Bricolage": bricolage,
  "Mobilité": mobilite,
  "Sport": sport,
  "Enfant": enfant,
  "Jeux": jeux,
  "Musique": musique,
  "Santé & beauté": santeBeaute,
  "Accessoires": accessoires,
  "Vêtements": vetements,
  "Animaux": animaux,
  "Bureau": bureau,
  "Autre": autre,
};

export function categoryImage(category: string): string | null {
  return CATEGORY_IMAGES[category] ?? autre;
}
