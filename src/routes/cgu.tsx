import { Link, createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/support";

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
      <p>
        Les présentes Conditions Générales d’Utilisation (CGU) encadrent l’accès et l’utilisation de l’application web et mobile{" "}
        <strong>Mes garanties</strong> (mesgaranties.com), éditée par <strong>Florent Foulquier</strong> (Entrepreneur individuel, SIREN 801 401 613).
        Mes garanties permet d’enregistrer ses objets, de suivre leurs garanties légales et commerciales, de tenir un carnet d’entretien et de SAV, de conserver des justificatifs et de préparer des courriers de réclamation.
      </p>
      <h2>2. Compte et foyer</h2>
      <p>
        Chaque utilisateur crée un compte personnel avec une adresse e-mail valide et demeure responsable de la confidentialité de ses identifiants.
        En créant ou en rejoignant un foyer, l’utilisateur accepte que les autres membres du foyer consultent et gèrent les objets partagés ainsi que leurs justificatifs. Son espace privé de profil reste strictement personnel.
      </p>
      <h2>3. Offres et abonnements</h2>
      <p>
        Mes garanties propose une offre Gratuite limitée à 5 objets et présente les futures offres payantes (Solo, Famille et Titane) sur la page{" "}
        <Link to="/tarifs" className="underline">Tarifs</Link>. À la date des présentes CGU, aucun système de paiement en ligne n’est encore actif.
        Des Conditions Générales de Vente (CGV) détaillant les modalités de paiement, de renouvellement, de résiliation, le droit de rétractation et la médiation de la consommation seront publiées avant toute activation d’abonnement payant.
      </p>
      <h2>4. Contenus de l’utilisateur</h2>
      <p>
        L’utilisateur reste propriétaire des informations, photos, tickets, factures et contrats qu’il ajoute et garantit disposer des droits nécessaires.
        Il s’engage à ne pas détourner le service de sa finalité ni y déposer de contenus illicites.
      </p>
      <h2>5. Responsabilité</h2>
      <p>
        Les dates d’échéance estimées, les informations issues de l’analyse automatique de justificatifs et les modèles de lettres sont fournis à titre indicatif ; l’utilisateur reste tenu de vérifier l’exactitude des informations enregistrées.
        Mes garanties ne fournit pas de conseil juridique et ne garantit pas l’acceptation d’une demande par un vendeur, un fabricant ou un assureur.
      </p>
      <h2>6. Modification et résiliation</h2>
      <p>
        L’éditeur peut faire évoluer les présentes CGU pour tenir compte des évolutions légales ou fonctionnelles. L’utilisateur peut supprimer son compte à tout moment depuis la rubrique Foyer ou via la page{" "}
        <Link to="/suppression-compte" className="underline">Suppression de compte</Link>.
      </p>
      <h2>7. Droit applicable</h2>
      <p>
        Les présentes CGU sont soumises au droit français. Pour toute question ou réclamation, vous pouvez écrire à{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a>.
        À défaut de résolution amiable, les juridictions françaises compétentes seront saisies conformément aux règles légales applicables.
      </p>
    </LegalPage>
  ),
});
