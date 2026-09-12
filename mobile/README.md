# Control sur iPhone avec Userscripts

Version Safari autonome pour Instagram, Facebook, Reddit et X/Twitter. Aucun PC allumé ni serveur Control nécessaire après installation. Le fichier contient le menu et les règles ; il ne télécharge pas de code supplémentaire et ne transmet pas de messages ou de données à Control.

## Installation depuis l'iPhone

1. Ouvrir Userscripts une fois. Conserver le dossier local proposé automatiquement.
2. Dans Réglages → Apps → Safari → Extensions → Userscripts, activer l'extension (sur d'anciennes versions d'iOS : Réglages → Safari → Extensions).
3. Ouvrir ce lien **dans Safari** : https://raw.githubusercontent.com/Ozan-roni/Pelge/main/mobile/Control-iPhone.user.js
4. Sur cette page, ouvrir le menu de page Safari, puis Extensions → Userscripts. Autoriser temporairement l'accès à cette page si demandé, puis choisir **Install** pour le script « Control — iPhone ». Vérifier qu'il est activé.
5. Ouvrir https://www.instagram.com/direct/inbox/?control=home. Dans le menu Safari → Userscripts, autoriser l'accès à Instagram, puis recharger la page. Le menu **CONTROL · SAFARI** doit apparaître.
6. Choisir un réseau dans Control. Autoriser Userscripts sur ce réseau la première fois, puis actualiser. Cela concerne instagram.com, facebook.com, reddit.com, x.com/twitter.com et messenger.com si Facebook y redirige.

L'autorisation sur la page de téléchargement ne remplace pas celle sur chaque réseau. Le menu de l'application Userscripts peut continuer à afficher une invitation à activer l'extension même lorsqu'elle est active : vérifier son état dans Safari.

Si l'installation depuis le lien ne propose rien, enregistrer **Control-iPhone.user.js** avec l'app Fichiers dans le dossier affiché par Userscripts. Garder le suffixe `.user.js` (pas `.txt`). Rouvrir le menu Userscripts dans Safari pour actualiser la liste, puis recharger le réseau.

## Utilisation

Garder le lien Instagram avec `?control=home` dans les **favoris Safari**, nommé Control. Utiliser Safari directement : une app web ajoutée à l'écran d'accueil peut avoir un comportement différent pour les extensions.

Sur les messageries, le bouton **Control** rouvre le choix des réseaux. La croix revient à la conversation. Sur un fil bloqué, les boutons permettent d'ouvrir les messages ou un autre réseau ; fermer Control ne permet pas de révéler le fil.

## Vérifier sur l'iPhone

- Le lien Control affiche le menu, puis Instagram ouvre les messages ou la connexion.
- Le bouton Control permet de changer de réseau et de revenir à la conversation.
- Ouvrir l'accueil, les Reels ou un profil Instagram doit afficher « Le fil fait une pause ».
- Même vérification sur un fil Facebook, une communauté Reddit et l'accueil X.
- Les formulaires de connexion, la saisie de messages et leurs pièces jointes restent natifs. Aucun envoi ou enregistrement audio n'est nécessaire pour cette vérification.

## Limites de cette édition

Cette première édition n'inclut pas les minuteurs, les limites quotidiennes, la pause de cinq minutes, les réglages/synchronisation du PC, les styles Instagram desktop ou les autres réseaux. Elle applique un mode fixe : messages et accès au compte uniquement. Désactiver Userscripts ou utiliser les applications natives contourne ces protections.

Elle ne crée pas les fonctions qu'un réseau refuse dans Safari mobile. Si une messagerie exige son application, Control ne peut pas lever cette restriction. La disponibilité réelle des messageries et l'intégration Userscripts doivent être vérifiées sur l'iPhone ; les tests du projet utilisent des pages simulées.

Sources : [installation Userscripts](https://github.com/quoid/userscripts#ios-ipados), [extensions Safari sur iPhone](https://support.apple.com/fr-fr/guide/iphone/iphab0432bf6/ios).
