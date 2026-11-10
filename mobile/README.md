# Control iPhone — Safari 2.1.0

Userscript pour l'extension **Userscripts** de Safari (iPhone / iPad). Il garde les réseaux sur leurs messages et ferme tout ce qui se fait défiler.

Lien d'installation et de mise à jour :
https://raw.githubusercontent.com/Ozan-roni/Pelge/main/mobile/Control-iPhone.user.js

## Blocage du défilement (depuis la 2.0.0)

Un noyau commun (`CONTROL GUARD`, en tête du script) décide pour chaque adresse, sur tous les réseaux :

| Page | Comportement |
| --- | --- |
| Messages, connexion, réglages du compte | ouverts, défilement normal |
| Accueil, fil, Explorer, Reels, Shorts, tendances, communautés | fermés : renvoi vers les messages |
| Un média précis (Reel reçu, vidéo Facebook, TikTok) | ouvert seul, défilement verrouillé, pas de vidéo suivante |
| Un post X, un fil de commentaires Reddit | ouvert, défilement plafonné |
| Un profil (Instagram, X, Reddit, Facebook, TikTok) | ouvert, défilement plafonné à environ trois écrans |
| Stories Instagram | uniquement entre 22 h et minuit (Paris), si l'option est active |

Différences avec les versions précédentes :

- Le blocage ne dépend plus d'une redirection réussie. Si le réseau renvoie vers son fil (cas de Facebook sur téléphone, qui ne propose pas toujours sa messagerie), la page est remplacée par un écran « Fil bloqué » et rien ne se charge derrière. Plus de boucle de rechargement.
- Les profils ne sont plus des fils infinis : au-delà du plafond, le défilement s'arrête.
- Passer à la vidéo suivante (balayage, lecture automatique) depuis un média ouvert est annulé : la page revient au média choisi.
- La connexion à X fonctionne de nouveau (la page de connexion était masquée).
- Les stories Facebook ne sont plus autorisées.

## Installation

1. Installer **Userscripts** depuis l'App Store.
2. Réglages → Apps → Safari → Extensions → Userscripts : activer, puis **Autoriser** sur « Tous les sites web ». Sans cette autorisation, le script ne tourne que sur les sites déjà acceptés et les autres réseaux défilent normalement.
3. Ouvrir le lien ci-dessus dans Safari, puis l'icône d'extension → Userscripts → installer.
4. Garder un seul script Control actif et recharger les onglets ouverts.

Vérifier que le script tourne : ouvrir `https://x.com/home`. La page doit basculer vers les messages (ou la connexion), jamais afficher le fil.

## Limites

- Le script agit dans Safari uniquement. Il ne modifie pas les applications iOS natives et n'agit pas dans Chrome ou un autre navigateur.
- Désactiver Userscripts retire le filtrage.
- Snapchat Web n'accepte pas les téléphones : il faut « Demander le site pour ordinateur » dans Safari. Control le remet ensuite au format téléphone (voir ci-dessous).

## Snapchat (2.1.0)

Nouveau bloc `CONTROL SNAPCHAT MOBILE` (source : `mobile/runtime/SnapchatLite.js`, intégré par `node scripts/build-snap-lite.cjs`). Il remplace les anciens adaptateurs Snapchat, qui restent dans le fichier mais ne s'exécutent plus.

- Deux écrans qui glissent : la liste des conversations, puis la conversation. Toucher un contact fait entrer la conversation par la droite ; le bouton retour de Snapchat ou un glissement vers la droite ramène à la liste.
- La liste affiche les noms et statuts (Snapchat les masque sur écran étroit) avec un titre « Chat ».
- La photo de montgolfières est retirée ; le bouton Spotlight et les entrées Stories sont masqués.
- La caméra reste disponible par le bouton jaune en bas à droite de la liste.
- Le script ne s'appuie que sur des repères stables de la page (`#root nav`, `span[id^="title-"]`, l'adresse `/web/<id>`), jamais sur les noms de classes, qui changent à chaque version de Snapchat. Aucun contenu n'est copié ni réécrit, et il n'y a plus d'observateur global de la page.

Vérifié sur le vrai Snapchat Web connecté, dans Chrome sur PC à 500 px de large : liste, ouverture et fermeture d'une conversation, écran caméra, absence de la photo et de Spotlight. Le glissement au doigt est vérifié par `node scripts/check-snap-lite.cjs` (13 contrôles, vrais points tactiles) sur une page de test qui reproduit cette structure.

Non vérifié : Safari sur iPhone, le clavier iOS dans une conversation, l'ouverture d'un Snap reçu et les appels (aucun appel n'a été passé pendant les essais). Les appels et les Snaps gardent l'interface de Snapchat, maintenant dans un écran vertical.

## Vérification

`npm run test:guard` (ou `node scripts/check-guard.cjs`) : 29 contrôles en émulation iPhone avec de vrais gestes tactiles, sur les vrais noms de domaine servis par des pages de test — accueil Facebook qui rebondit, Reel reçu, balayage vers la vidéo suivante, fils X / Reddit / Instagram, plafonds, pages de connexion.

Contrôlé aussi sur les vrais sites, sans compte, sous WebKit et Chromium : profil X plafonné, fil TikTok remplacé par l'écran de blocage, connexions accessibles.

Non vérifié : un vrai iPhone, et les pages qui demandent d'être connecté (fil d'accueil Facebook, messagerie Instagram réelle).

`node scripts/simulate-iphone.cjs [url] [--raw]` ouvre une fenêtre au format iPhone sur le vrai site, avec le script injecté, pour développer sur la structure réelle.

Les sources Snapchat mobiles sont dans `mobile/runtime` ; `node scripts/build-snapchat.cjs` régénère leur bloc intégré.
