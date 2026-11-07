import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, ToFill } from "@/components/LegalPage";

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
        <li>Raison sociale ou nom : <ToFill>nom de la société ou de l’éditeur</ToFill></li>
        <li>Forme juridique et capital : <ToFill>forme juridique, capital social</ToFill></li>
        <li>Adresse du siège : <ToFill>adresse postale</ToFill></li>
        <li>SIREN / RCS : <ToFill>numéro SIREN et ville du RCS</ToFill></li>
        <li>N° TVA intracommunautaire : <ToFill>numéro de TVA</ToFill></li>
        <li>E-mail de contact : <ToFill>adresse e-mail</ToFill></li>
        <li>Téléphone : <ToFill>numéro de téléphone</ToFill></li>
        <li>Directeur de la publication : <ToFill>prénom et nom</ToFill></li>
      </ul>
      <h2>Hébergement</h2>
      <ul>
        <li>Hébergeur : <ToFill>nom de l’hébergeur</ToFill></li>
        <li>Adresse de l’hébergeur : <ToFill>adresse postale</ToFill></li>
        <li>Contact de l’hébergeur : <ToFill>téléphone ou site web</ToFill></li>
      </ul>
      <h2>Application</h2>
      <ul>
        <li>Nom : Mes garanties</li>
        <li>Adresse du site : <ToFill>adresse web officielle</ToFill></li>
        <li>Version des applications mobiles : <ToFill>stores et version, le cas échéant</ToFill></li>
      </ul>
      <h2>Propriété intellectuelle</h2>
      <p>Les contenus, textes, logos et éléments graphiques de Mes garanties sont la propriété de l’éditeur, sauf mention contraire. Toute reproduction sans autorisation est interdite.</p>
      <h2>Information juridique</h2>
      <p>Les modèles de lettres proposés sont fournis à titre informatif et ne constituent pas un conseil juridique.</p>
    </LegalPage>
  ),
});
