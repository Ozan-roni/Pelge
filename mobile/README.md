# Control iPhone — Safari 1.7.1

## Installation

Ouvrir dans Safari le fichier Control-iPhone.user.js de ce dossier, puis l’installer dans Userscripts. Remplacer l’ancienne version, garder une seule copie active et recharger les onglets Safari. Vérifier le champ @version : 1.7.1.

Lien direct : https://raw.githubusercontent.com/Ozan-roni/Pelge/main/mobile/Control-iPhone.user.js

## Comportement

- Instagram reste centré sur les messages. Un Reel reçu est lisible, sans défilement vers les médias suivants ; fermer le lecteur libère le défilement des messages.
- Les lecteurs superposés aux messages sont couverts même si l’adresse ne change pas. Les commandes natives du lecteur restent utilisables.
- Les stories sont désactivées par défaut ; les Options Control dans Instagram permettent de les autoriser.
- Snapchat : chargement jaune, fantôme blanc, caméra outline à droite pour Répondre, contrôle Reçu distinct, avatars de groupe centrés et décorations SVG identifiables retirées. Les vrais contrôles natifs conservent leurs gestes.

Tests sur pages isolées et médias générés localement, aux tailles 320, 390 et 430 px. Les tests ne constituent pas une validation sur un iPhone physique ou un compte Snapchat connecté. Aucun serveur ni PC allumé n’est nécessaire au script.