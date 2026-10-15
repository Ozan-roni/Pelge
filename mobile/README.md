# Control iPhone — Safari 1.7.2

## Installation

Ouvrir dans Safari le fichier Control-iPhone.user.js de ce dossier, puis l’installer dans Userscripts. Remplacer l’ancienne version, garder une seule copie active et recharger les onglets Safari. Vérifier le champ @version : 1.7.2.

Lien direct : https://raw.githubusercontent.com/Ozan-roni/Pelge/main/mobile/Control-iPhone.user.js

## Mises à jour

Cette édition contient `@updateURL` vers `Control-iPhone.meta.js` et `@downloadURL` vers le script de ce dépôt. Utiliser la commande de mise à jour de Userscripts lorsqu’elle est disponible ; sinon remplacer le script depuis le même lien. Une ancienne copie sans ces métadonnées doit être remplacée une première fois. Les mises à jour silencieuses sur tous les iPhone ne sont pas garanties.

## Comportement

- Instagram reste centré sur les messages. Un Reel reçu est lisible, sans défilement vers les médias suivants ; fermer le lecteur libère le défilement des messages.
- Les lecteurs superposés aux messages sont couverts même si l’adresse ne change pas. Les commandes natives du lecteur restent utilisables.
- Les stories sont désactivées par défaut ; les Options Control dans Instagram permettent de les autoriser.
- Snapchat : chargement jaune, fantôme blanc, caméra outline à droite pour Répondre, contrôle Reçu distinct, avatars de groupe centrés et décorations SVG identifiables retirées. Les vrais contrôles natifs conservent leurs gestes.

Tests sur pages isolées et médias générés localement, aux tailles 320, 390 et 430 px. Les tests ne constituent pas une validation sur un iPhone physique ou un compte Snapchat connecté. Aucun serveur ni PC allumé n’est nécessaire au script.