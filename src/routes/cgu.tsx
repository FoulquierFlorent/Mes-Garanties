import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, ToFill } from "@/components/LegalPage";

export const Route = createFileRoute("/cgu")({
  head: () => ({
    meta: [
      { title: "Conditions générales d’utilisation — Mes garanties" },
      { name: "description", content: "Règles d’utilisation de l’application Mes garanties et de ses abonnements." },
      { property: "og:title", content: "Conditions générales d’utilisation — Mes garanties" },
      { property: "og:description", content: "Règles d’utilisation de l’application Mes garanties et de ses abonnements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Conditions générales d’utilisation">
      <h2>1. Objet</h2>
      <p>Les présentes conditions encadrent l’utilisation de Mes garanties, éditée par <ToFill>nom de l’éditeur</ToFill>, qui permet d’enregistrer ses objets, suivre leurs garanties et préparer des courriers.</p>
      <h2>2. Compte et foyer</h2>
      <p>Chaque utilisateur crée un compte personnel et reste responsable de ses identifiants. En rejoignant un foyer, il accepte que les autres membres voient les objets partagés.</p>
      <h2>3. Offres et abonnements</h2>
      <p>Une offre Gratuite limitée à 5 objets et des offres payantes (Solo, Famille, Titane) sont proposées aux tarifs affichés sur la page Tarifs. Modalités de paiement, de renouvellement et de résiliation : <ToFill>conditions de paiement et de résiliation</ToFill>. Droit de rétractation : <ToFill>modalités (14 jours pour les consommateurs)</ToFill>.</p>
      <h2>4. Contenus de l’utilisateur</h2>
      <p>L’utilisateur reste propriétaire des informations et fichiers qu’il ajoute et garantit en avoir le droit.</p>
      <h2>5. Responsabilité</h2>
      <p>Les dates calculées et modèles de lettres sont fournis à titre indicatif ; ils ne remplacent pas un conseil juridique. L’éditeur ne garantit pas l’acceptation d’une demande par un vendeur ou un fabricant.</p>
      <h2>6. Modification et résiliation</h2>
      <p>L’éditeur peut faire évoluer ces conditions ; l’utilisateur en sera informé. Il peut supprimer son compte à tout moment.</p>
      <h2>7. Droit applicable</h2>
      <p>Droit français. Médiateur de la consommation : <ToFill>nom et coordonnées du médiateur</ToFill>. Tribunal compétent : <ToFill>ville</ToFill>.</p>
    </LegalPage>
  ),
});
