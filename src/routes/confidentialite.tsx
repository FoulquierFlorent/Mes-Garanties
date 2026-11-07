import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, ToFill } from "@/components/LegalPage";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Mes garanties" },
      { name: "description", content: "Comment Mes garanties collecte, utilise et protège vos données personnelles." },
      { property: "og:title", content: "Politique de confidentialité — Mes garanties" },
      { property: "og:description", content: "Comment Mes garanties collecte, utilise et protège vos données personnelles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Politique de confidentialité">
      <h2>Responsable du traitement</h2>
      <p><ToFill>nom de l’éditeur</ToFill>, <ToFill>adresse</ToFill>. Contact : <ToFill>e-mail de contact données personnelles</ToFill>. Délégué à la protection des données : <ToFill>nom et contact du DPO, ou « non désigné »</ToFill>.</p>
      <h2>Données collectées</h2>
      <ul>
        <li>Compte : adresse e-mail, prénom, couleur de profil.</li>
        <li>Objets : nom, catégorie, date et prix d’achat, garanties, descriptif, numéro de facture.</li>
        <li>Fichiers : tickets, factures et photos que vous ajoutez, ainsi que le texte qui en est extrait.</li>
        <li>Espace privé du profil : informations que vous choisissez d’y saisir.</li>
      </ul>
      <h2>Finalités et bases légales</h2>
      <p>Fournir le service (exécution du contrat), envoyer des rappels d’échéance, partager les objets au sein du foyer, gérer les abonnements. <ToFill>autres finalités éventuelles (statistiques, newsletter…)</ToFill></p>
      <h2>Destinataires</h2>
      <p>Les membres de votre foyer voient les objets partagés et leurs justificatifs. Les données sont hébergées par nos sous-traitants techniques ; un service d’intelligence artificielle peut traiter le texte des justificatifs pour en produire un résumé. <ToFill>liste des sous-traitants, prestataire de paiement</ToFill></p>
      <h2>Durée de conservation</h2>
      <p>Tant que le compte est actif, puis <ToFill>durée après suppression du compte</ToFill>.</p>
      <h2>Vos droits</h2>
      <p>Accès, rectification, effacement, portabilité, opposition et limitation : écrivez à <ToFill>e-mail de contact</ToFill>. Vous pouvez aussi saisir la CNIL (www.cnil.fr).</p>
      <h2>Cookies</h2>
      <p>Seuls des éléments techniques nécessaires à la connexion sont utilisés. <ToFill>préciser si des cookies de mesure d’audience sont ajoutés</ToFill></p>
    </LegalPage>
  ),
});
