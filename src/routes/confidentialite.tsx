import { Link, createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/support";

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
      <h2>1. Responsable du traitement</h2>
      <p>
        Le service <strong>Mes garanties</strong> (mesgaranties.com) est édité par <strong>Florent Foulquier</strong>,
        Entrepreneur individuel, domicilié Rue la Clé des champs, Maison 5, 31190 Auterive, France (SIREN : 801 401 613).
      </p>
      <p>
        <strong>Contact pour la protection des données personnelles :</strong>{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a>.
      </p>

      <h2>2. Données personnelles collectées</h2>
      <ul>
        <li><strong>Compte et profil :</strong> adresse e-mail, mot de passe chiffré, prénom, couleur de profil, préférences d’alertes et informations facultatives de votre espace privé (lien familial, coordonnées, notes).</li>
        <li><strong>Foyer partagé :</strong> nom du foyer, membres associés, invitations par e-mail et attribution des objets.</li>
        <li><strong>Objets et garanties :</strong> nom, marque, magasin, catégorie, date et prix d’achat, numéro et date de commande ou de facture, descriptif, garanties légales et commerciales (fournisseur, dates, conditions), suivi des vices cachés, assurance casse ou vol (numéro de contrat et dates).</li>
        <li><strong>Entretiens, réparations et démarches :</strong> carnet d’entretien (interventions, montants, réparateurs, fréquences), historique de réparations et SAV, courriers de réclamation enregistrés et numéros de suivi de retour.</li>
        <li><strong>Fichiers privés :</strong> tickets de caisse, factures, contrats de garantie, photos d’objets ou de dommages, ainsi que le texte extrait par reconnaissance optique (OCR).</li>
        <li><strong>Support client :</strong> nom, adresse e-mail, catégorie, sujet et message transmis via le formulaire d’aide ou par e-mail.</li>
      </ul>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li><strong>Fourniture du service</strong> (gestion des objets, garanties, calendrier, foyer partagé, carnet d’entretien, courriers et exports) : exécution du contrat (art. 6.1.b RGPD).</li>
        <li><strong>Envoi d’alertes d’échéance et d’e-mails transactionnels</strong> depuis <code>noreply@mesgaranties.com</code> : exécution du contrat et préférences configurées par l’utilisateur.</li>
        <li><strong>Analyse assistée par intelligence artificielle</strong> (pré-remplissage à partir d’un ticket et résumé des justificatifs) : déclenchée uniquement à votre demande (consentement / exécution du service demandé).</li>
        <li><strong>Assistance et sécurité du service</strong> (réponse aux demandes, prévention des abus et limitation des envois) : intérêt légitime (art. 6.1.f RGPD).</li>
      </ul>

      <h2>4. Hébergement, sous-traitants et transferts</h2>
      <ul>
        <li><strong>Base de données et fichiers privés :</strong> hébergés via Lovable Cloud (infrastructure Supabase) dans la région <strong>AWS Irlande (eu-west-1, Union européenne)</strong>. Les justificatifs et photos sont stockés dans des espaces privés non accessibles par lien public et protégés par des règles d’accès par foyer.</li>
        <li><strong>Diffusion de l’application web :</strong> réseau Edge de Lovable. Nom de domaine <code>mesgaranties.com</code> enregistré via Name.com.</li>
        <li><strong>Intelligence artificielle :</strong> lorsque vous lancez l’analyse d’un ticket ou le résumé d’un justificatif, le document ou le texte extrait est transmis via Lovable AI Gateway (Lovable AB, Suède) au modèle OpenAI (<code>gpt-6-astra</code>). Mes Garanties envoie le paramètre technique <code>store: false</code> afin de ne pas activer la conservation applicative des requêtes, et ne stocke pas vos documents chez le prestataire d’IA. Des transferts techniques hors Union européenne pouvant intervenir, le traitement reste soumis aux politiques de confidentialité de{" "}
          <a href="https://lovable.dev/privacy" target="_blank" rel="noreferrer" className="underline">Lovable</a> et d’OpenAI.</li>
        <li><strong>Paiements :</strong> aucun prestataire de paiement n’est actuellement intégré et aucun paiement n’est encaissé sur le site. Lors de l’activation future des abonnements payants, les paiements seront traités par Stripe (web), Apple (App Store) et Google (Google Play), et cette politique sera mise à jour en conséquence.</li>
        <li><strong>Membres du foyer :</strong> les membres d’un même foyer accèdent aux objets partagés et à leurs justificatifs. Votre espace privé de profil reste strictement personnel.</li>
      </ul>

      <h2>5. Mesure d’audience et cookies</h2>
      <p>
        <strong>Connexion :</strong> Mes garanties utilise uniquement des éléments techniques de stockage navigateur nécessaires au maintien de votre session de connexion. Aucun cookie publicitaire n’est déposé.
      </p>
      <p>
        <strong>Mesure d’audience Lovable :</strong> le site utilise la mesure d’audience de Lovable, qui n’utilise aucun cookie, ne stocke rien sur votre appareil, ne conserve pas les adresses IP et n’identifie pas les visiteurs. Lovable collecte ces données pour notre compte. La{" "}
        <a href="https://lovable.dev/privacy" target="_blank" rel="noreferrer" className="underline">politique de confidentialité de Lovable</a>{" "}
        explique comment elles sont traitées.
      </p>
      <p>
        Elle enregistre pour chaque visiteur, sans cookie et sans identifier personne : les pages visitées, la provenance, le pays, le navigateur, le système d’exploitation et le type d’appareil, la durée de visite, la vitesse de chargement des pages, les erreurs et les clics sur les boutons et liens. Les données détaillées sont conservées 90 jours et les résumés quotidiens pendant un an.
      </p>

      <h2>6. Durées de conservation</h2>
      <ul>
        <li><strong>Données du compte, objets et fichiers :</strong> conservés tant que votre compte est actif.</li>
        <li><strong>Après suppression du compte :</strong> effacement immédiat de votre compte, de votre espace privé et de vos objets personnels ; les sauvegardes techniques sont purgées sous 30 jours maximum. Les objets partagés dans un foyer comptant d’autres membres sont conservés pour ces membres.</li>
        <li><strong>Demandes de support :</strong> conservées jusqu’à 12 mois après traitement.</li>
      </ul>

      <h2>7. Suppression du compte et vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données. Vous pouvez exercer ces droits en écrivant à{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a>.
      </p>
      <p>
        Vous pouvez supprimer définitivement votre compte depuis l’application (rubrique <strong>Foyer</strong>) ou consulter la procédure dédiée accessible sans connexion sur la page{" "}
        <Link to="/suppression-compte" className="underline">Suppression de compte</Link>.
      </p>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la{" "}
        <a href="https://www.cnil.fr" target="_blank" rel="noreferrer" className="underline">CNIL</a>.
      </p>
    </LegalPage>
  ),
});
