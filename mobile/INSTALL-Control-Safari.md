# Control : sources PC adaptées à Userscripts sur iPhone

Version 0.34.4.3 — fichier autonome de 4,9 Mo. Images optimisées en WebP ; modules et réglages conservés.

## Installation dans Safari

1. Activer l’extension Userscripts dans les réglages de Safari.
2. Ouvrir [Control-Safari.user.js](https://raw.githubusercontent.com/Ozan-roni/Pelge/control-safari-iphone-download/mobile/Control-Safari.user.js) **dans Safari**. Le chargement peut prendre un moment.
3. Ouvrir le menu de la page → Userscripts → **Install** pour « Control — Safari (extension PC adaptée) ».
4. **Désactiver l’ancien script « Control — iPhone »** : ne pas faire fonctionner les deux versions ensemble.
5. Ouvrir [Control](https://www.instagram.com/direct/inbox/?control=home), autoriser Userscripts sur Instagram et recharger la page.

Si Safari télécharge le fichier au lieu de l’afficher, le placer avec l’app Fichiers dans le dossier indiqué par Userscripts. Garder le suffixe `.user.js`, sans `.txt`. Rouvrir le menu Userscripts pour actualiser la liste.

Le bouton **Revenir au site** ferme le tableau de bord. Le bouton **Control** en haut à gauche permet de le rouvrir. Autoriser Userscripts sur chaque autre réseau utilisé. Content Shield exige aussi cette autorisation sur les autres domaines à masquer.

## Contenu

Cette édition reprend les sources originales de Control 0.34.4 : tableau de bord, images et icônes, vues Grid/List/Cards, styles Instagram, modules ContentFilter, InstagramVisuals, ExtendedFilters et SensitiveProtection, réglages des huit réseaux, limites quotidiennes, pause de cinq minutes, activité et thèmes. Les écrans de compte, administration, contact et don conservent le fonctionnement local et les placeholders du prototype PC.

Les réglages sont conservés dans le stockage du script Userscripts et partagés entre les sites sur cet appareil. Les réglages personnels du PC ne sont pas transférés automatiquement.

## Limites de l’adaptation

Userscripts ne fournit pas les services d’arrière-plan, alarmes et règles de blocage réseau de Chrome. Le temps quotidien est compté pendant les intervalles où la page est visible, hors du tableau de bord, avec une activité récente ; les longues suspensions iOS sont ignorées. Content Shield masque une page après le début du chargement et ne bloque pas sa première requête réseau. Certaines actions de fermeture d’onglet ouvrent le choix des applications à la place.

Cette édition agit dans Safari, pas dans les applications natives. Les appels, notes, stories et messageries restent limités aux fonctions réellement proposées par chaque réseau dans Safari mobile. Les sélecteurs peuvent nécessiter des corrections lorsque ces sites changent. Il n’y a pas de synchronisation automatique avec le PC ni de nouveaux services serveur.

Tests effectués avec Chromium et WebKit sur des pages simulées à des largeurs mobiles : tableau de bord, réglages persistants, filtres, limites atteintes, pause de cinq minutes, thèmes, conservation d’un brouillon, routes, YouTube mobile, Messenger et blocage de domaine. Aucun compte réel ni iPhone physique n’a été utilisé pour ces tests.

Le fichier `Control-iPhone.user.js` reste disponible séparément comme ancienne édition simplifiée.

[Documentation officielle Userscripts](https://github.com/quoid/userscripts#ios-ipados).

## Instagram mobile — 0.34.4.3
Navigation en bas avec Control à la place de Reels, sans bouton flottant ni timer. Barre masquée dans les conversations pour préserver la saisie. Chargement avec logo seul et fondu ; redirection initiale des routes bloquées vers les messages. Notes non collantes. Désactiver impérativement l’ancien script Control — iPhone, qui ajoute son propre bouton et ses blocages.
Tests WebKit sur pages simulées ; validation sur iPhone réel encore nécessaire.
