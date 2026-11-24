# Politique de confidentialité — version définitive (brouillon soumis à validation)

Ce texte est destiné à remplacer `https://mesgaranties.com/confidentialite`.
Aucune ligne n'est appliquée pour l'instant. Les lignes marquées `⏳` attendent votre réponse.

---

## 1. Responsable du traitement

Mes Garanties est éditée par **Florent Foulquier, entrepreneur individuel**.
- ⏳ Adresse postale : *(en attente de votre validation)*
- ⏳ SIREN : *(en attente de votre validation)*
- Contact données personnelles : **mesgaranties.support@gmail.com**
- Aucun délégué à la protection des données n'a été désigné.

## 2. Données collectées

| Catégorie | Contenu |
|---|---|
| Compte | adresse e-mail, identifiant de connexion, prénom, couleur de profil |
| Foyer | nom du foyer, membres, rôle de chaque membre, invitations envoyées |
| Espace privé du profil | informations que vous choisissez d'y saisir (e-mail, lien familial…) |
| Objets | nom, catégorie, description, prix, date d'achat, numéro de commande ou de facture |
| Garanties | garantie légale de conformité, magasin, marque, constructeur, extension, réparation : durée, fournisseur, dates, conditions, contrat joint |
| Justificatifs | tickets et factures que vous téléversez, texte lu automatiquement (OCR), résumé généré |
| Photos | photos d'objet, photos de l'objet endommagé, photos avant/après |
| Carnet d'entretien | interventions, dates, réparateur, montants payés et pris en charge, pièces, périodicité, échéances |
| Réparations et SAV | pannes, dates, prolongations de garantie calculées, garantie des pièces |
| Vices cachés | date de découverte et justificatif |
| Assurance | numéro de contrat, dates de couverture casse / vol |
| Courriers | contenu du courrier généré, destinataire, date d'envoi, numéro de suivi postal |
| Alertes | délai choisi, adresse de réception, préférence de date d'envoi |
| Assistance | message, adresse e-mail et objet transmis via le formulaire d'aide |
| Navigation | voir § 6 |

## 3. Finalités et bases légales

- **Exécution du contrat** : créer et faire fonctionner votre compte, enregistrer vos objets et vos garanties, générer vos courriers, envoyer vos rappels, partager les objets de votre foyer.
- **Consentement** : analyse d'un ticket ou d'une facture par intelligence artificielle, et résumé de vos justificatifs. Ces deux fonctions ne se déclenchent que si vous les lancez.
- **Intérêt légitime** : sécurité de la plateforme, prévention des abus sur le formulaire d'aide, maintenance technique.
- **Obligation légale** : conservation des pièces comptables et fiscales dès lors que des abonnements payants sont commercialisés.

## 4. Où sont vos données, et qui y a accès

**Hébergement et stockage**
- Base de données (comptes, objets, garanties, carnets d'entretien) et fichiers privés (tickets, factures, photos, contrats) : **Lovable Cloud**, exploité sur **Amazon Web Services, région `eu-west-1` (Irlande, Union européenne)**.
- Application web et fonctions serveur : réseau de distribution de Lovable, transmission chiffrée HTTPS en continu.
- Nom de domaine `mesgaranties.com` : enregistré auprès de **Name.com**.

**Accès**
- Vos justificatifs, photos et contrats sont rangés dans un dossier privé par objet. Ils ne sont pas accessibles depuis une adresse publique : un lien direct ne les ouvre pas.
- Seuls **vous** et les **membres du foyer auquel vous avez rejoint** peuvent voir vos objets et leurs pièces jointes. Un membre d'un autre foyer, un visiteur ou un moteur de recherche n'y accède pas.
- L'éditeur peut intervenir techniquement sur la base pour maintenir le service.

**Sous-traitants et prestataires**
1. **Lovable Cloud** — hébergement de la base, du stockage de fichiers et de l'authentification (Union européenne).
2. **Lovable AI Gateway**, opéré par Lovable AB (Suède), qui relaie la demande vers le modèle choisi (OpenAI). Chaque appel est envoyé avec l'option `store: false` : ni la passerelle ni le fournisseur du modèle ne conservent le contenu envoyé, et il n'est pas utilisé pour entraîner des modèles. Seuls l'image ou le texte du justificatif, le nom et la marque de l'objet transitent.
3. **Google Fonts** — la page charge une feuille de style auprès de `fonts.googleapis.com` ; cette requête transmet votre adresse IP à Google.
4. **Mesure d'audience Lovable** — voir § 6.
5. **Prestataires de paiement** : *aucun n'est actif aujourd'hui*. Aucun numéro de carte n'est saisi dans l'application. Lors de l'ouverture des paiements, les prestataires retenus seront **Stripe** (Stripe Payments Europe, Irlande) pour le site web, **Apple In-App Purchase** (Apple Distribution International, Irlande) et **Google Play Billing** (Google Ireland Limited, Irlande) pour les applications mobiles. Ils traiteront alors votre identité d'acheteur, le montant et l'historique de votre abonnement.
6. **Support** : les demandes envoyées depuis le formulaire sont transmises à **mesgaranties.support@gmail.com**, adresse gérée par l'éditeur.

**Aucune donnée n'est vendue, louée ni transmise à des fins publicitaires.**

## 5. Transferts hors de l'Union européenne

Les comptes, objets, justificatifs, photos et contrats sont stockés dans l'Union européenne.
Deux services peuvent traiter des informations en dehors de l'UE :
- la requête envoyée à l'analyse de ticket transite par une passerelle européenne puis par le fournisseur du modèle ; cette transmission est limitée au contenu du justificatif, sans conservation ;
- la feuille de style typographique est servie par Google, qui voit l'adresse IP de la personne qui charge la page.

## 6. Mesure d'audience et cookies

**Cookies** : l'application n'utilise que les éléments techniques nécessaires au maintien de la session (jeton de connexion). Elle ne dépose **aucun cookie publicitaire**, aucune pixel de suivi, aucun traceur tiers de publicité.

**Mesure d'audience** : la plateforme Lovable ajoute à chaque page un petit script de mesure d'audience. Il **n'utilise pas de cookies**, **ne stocke rien sur votre appareil**, **ne conserve pas votre adresse IP** et **ne permet pas d'identifier une personne**. Chaque visite est comptée séparément, sans reconnaître les visiteurs de retour.

Sur ce site, le script enregistre pour **chaque visiteur**, sans qu'un choix préalable soit demandé :
- les pages consultées et le site d'origine du visiteur ;
- le pays, le navigateur, le système d'exploitation et le type d'appareil (ordinateur, mobile, tablette) ;
- la durée de la visite, la vitesse d'affichage des pages et les erreurs rencontrées ;
- les clics sur les boutons et les liens (le suivi des clics est activé) ;
- les rapports d'erreur transmis par l'application elle-même.

Ces informations sont enregistrées pour tous les visiteurs, sans cookies et sans identifier personne : le site ne propose pas de bandeau de consentement qui reporterait cette mesure.

**Durées de conservation de la mesure d'audience** : les données détaillées sont conservées **90 jours** ; les résumés quotidiens (nombre de visites et de pages vues, pages consultées et site d'origine pour chaque visite) sont conservés **un an**.

## 7. Durées de conservation

- Compte, objets, garanties, justificatifs, photos et carnets d'entretien : **tant que le compte est actif**.
- Demande d'assistance : jusqu'à la clôture du dossier, puis suppression au plus tard **un an** après.
- Mesure d'audience : 90 jours en détail, un an en résumé quotidien (§ 6).
- Après une suppression de compte : les données de la base et les fichiers privés sont effacés. Des copies de sauvegarde technique peuvent subsister le temps de leur purge périodique.
- En cas de facturation d'un abonnement : les pièces comptables sont conservées pendant la durée légale applicable.

## 8. Suppression du compte et de vos données

**Depuis l'application, connecté** : page **Foyer** → bouton **« Supprimer définitivement mon compte »** → saisie obligatoire du mot **SUPPRIMER**.
Sont effacés sans retour possible : le compte de connexion et l'adresse e-mail, l'espace privé du profil, les objets personnels et **tous** leurs fichiers (tickets, factures, photos, contrats), les préférences d'alerte et les liens d'invitation du foyer.
Les objets que vous aviez partagés avec un autre membre du foyer **restent accessibles à ce membre** : une garantie suivie à plusieurs ne disparaît pas au départ de l'un.

**Depuis une page web, sans être connecté** :
- par e-mail à **mesgaranties.support@gmail.com**, en indiquant l'adresse du compte ;
- ou par le formulaire public **https://mesgaranties.com/aide**, ouvert à tous sans compte.
⏳ Une page dédiée `https://mesgaranties.com/suppression-compte` reste à créer si vous souhaitez la renseigner telle quelle dans la console Google Play.

## 9. Vos droits

Accès, rectification, effacement, portabilité, limitation et opposition : écrivez à **mesgaranties.support@gmail.com**. Une réponse est apportée sous un mois.
Vous pouvez saisir la **CNIL** (https://www.cnil.fr) de toute réclamation.

## 10. Sécurité

Chiffrement HTTPS de bout en bout, chiffrement des données au repos, accès aux enregistrements filtré par des règles côté serveur (chacun ne voit que son propre foyer), dossiers de fichiers non listables publiquement, et limitation du nombre d'envois depuis le formulaire d'aide.

## 11. Mineurs

Le service ne est pas destiné aux mineurs de moins de 16 ans et aucune donnée d'enfant n'est collectée sciemment.

## 12. Évolution de cette politique

Toute modification sera publiée sur cette page avec sa date de mise à jour. Une information par e-mail est envoyée aux personnes concernées en cas de changement important.

**Dernière mise à jour : 24 novembre 2026.**
