import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/support";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Mes garanties" },
      { name: "description", content: "Informations sur l’éditeur et l’hébergeur de l’application Mes garanties." },
      { property: "og:title", content: "Mentions légales — Mes garanties" },
      { property: "og:description", content: "Informations sur l’éditeur et l’hébergeur de l’application Mes garanties." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Mentions légales">
      <h2>Éditeur</h2>
      <ul>
        <li>Nom de l’éditeur : Florent Foulquier</li>
        <li>Statut juridique : Entrepreneur individuel</li>
        <li>Adresse : Rue la Clé des champs, Maison 5, 31190 Auterive, France</li>
        <li>SIREN : 801 401 613</li>
        <li>TVA : TVA non applicable, art. 293 B du CGI</li>
        <li>E-mail de contact : <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a></li>
        <li>Directeur de la publication : Florent Foulquier</li>
      </ul>
      <h2>Hébergement</h2>
      <ul>
        <li>Plateforme et hébergement applicatif : Lovable AB (Stockholm, Suède) — <a href="https://lovable.dev" target="_blank" rel="noreferrer" className="underline">lovable.dev</a></li>
        <li>Hébergement de la base de données et des fichiers : Lovable Cloud (infrastructure Supabase), région AWS Irlande (eu-west-1, Union européenne)</li>
        <li>Nom de domaine : mesgaranties.com (enregistré via Name.com)</li>
      </ul>
      <h2>Application</h2>
      <ul>
        <li>Nom : Mes garanties</li>
        <li>Adresse du site : <a href="https://mesgaranties.com" className="underline">https://mesgaranties.com</a></li>
        <li>Applications mobiles : publication en cours de préparation sur Google Play et App Store</li>
      </ul>
      <h2>Propriété intellectuelle</h2>
      <p>Les contenus, textes, logos et éléments graphiques de Mes garanties sont la propriété de l’éditeur, sauf mention contraire. Toute reproduction sans autorisation est interdite.</p>
      <h2>Information juridique</h2>
      <p>Les durées estimées et les modèles de lettres proposés par Mes garanties sont fournis à titre informatif et ne constituent pas un conseil juridique.</p>
    </LegalPage>
  ),
});
