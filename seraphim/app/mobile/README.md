# Control iPhone — Safari 2.0.0

Userscript pour l'extension **Userscripts** de Safari (iPhone / iPad). Il garde les réseaux sur leurs messages et ferme tout ce qui se fait défiler.

Lien d'installation et de mise à jour :
https://raw.githubusercontent.com/Ozan-roni/Pelge/main/mobile/Control-iPhone.user.js

## Ce que fait la 2.0.0

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
- Snapchat Web n'accepte pas les téléphones : il faut « Demander le site pour ordinateur », ce qui donne une interface d'ordinateur. Sa refonte mobile (conversations, glissements, appels) est en cours et n'est pas dans cette version.

## Vérification

`npm run test:guard` (ou `node scripts/check-guard.cjs`) : 29 contrôles en émulation iPhone avec de vrais gestes tactiles, sur les vrais noms de domaine servis par des pages de test — accueil Facebook qui rebondit, Reel reçu, balayage vers la vidéo suivante, fils X / Reddit / Instagram, plafonds, pages de connexion.

Contrôlé aussi sur les vrais sites, sans compte, sous WebKit et Chromium : profil X plafonné, fil TikTok remplacé par l'écran de blocage, connexions accessibles.

Non vérifié : un vrai iPhone, et les pages qui demandent d'être connecté (fil d'accueil Facebook, messagerie Instagram réelle).

`node scripts/simulate-iphone.cjs [url] [--raw]` ouvre une fenêtre au format iPhone sur le vrai site, avec le script injecté, pour développer sur la structure réelle.

Les sources Snapchat mobiles sont dans `mobile/runtime` ; `node scripts/build-snapchat.cjs` régénère leur bloc intégré.
