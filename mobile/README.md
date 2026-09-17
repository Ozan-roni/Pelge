# Control iPhone — Safari 1.3.0

Cette édition complète remplace les versions précédentes. Aucun menu, bouton flottant Control ou page de remplacement : les sites natifs restent affichés, avec deux onglets de navigation sur Snapchat mobile. Aucun serveur Control ni PC allumé n'est nécessaire.

## Installation / mise à jour

Fichier complet en ligne : https://raw.githubusercontent.com/Ozan-roni/Pelge/main/mobile/Control-iPhone.user.js

Ouvrir ce lien dans Safari et utiliser l'installation proposée par Userscripts. Remplacer la version existante, puis recharger les onglets. Vérifier que la version installée est **1.3.0**. Une mise à jour sur GitHub ne remplace pas automatiquement un script déjà installé sur l'iPhone.

Alternative avec l'archive :

1. Décompresser l'archive dans Fichiers sur l'iPhone.
2. Dans Userscripts, repérer son dossier de scripts. Y remplacer l'ancien fichier `Control-iPhone.user.js` par celui fourni ici. Ne pas garder deux versions actives. Ne pas renommer le fichier en `.txt`.
3. Dans Réglages → Apps → Safari → Extensions → Userscripts, activer l'extension et autoriser son accès aux réseaux utilisés, notamment Instagram et Snapchat.
4. Fermer puis rouvrir les onglets Instagram et Snapchat : un ancien script reste actif jusqu'au rechargement de la page.
5. Ouvrir directement https://www.instagram.com/direct/inbox/ ou https://web.snapchat.com/ dans Safari. L'ancien favori avec `?control=home` n'affiche plus de menu.

## Instagram

- Les pièces jointes vidéo affichées dans les messages restent natives et lisibles.
- Un clic sur un lien de publication/Reel dans une conversation autorise seulement cet élément, dans le même onglet, pendant dix minutes.
- Dans ce lecteur isolé : défilement tactile/molette/clavier, contrôles suivant/précédent et autres vidéos détectées sont bloqués. Retour aux messages avec le retour Safari ou le bouton natif d'Instagram.
- Le défilement des conversations reste possible pour lire les messages. Aucun fil de découverte n'est autorisé.
- Un lien Reel ouvert directement, sans passer par une conversation, renvoie aux messages.
- Quand les conteneurs natifs sont reconnus, recherche, statuts/Notes et liste des conversations défilent dans une seule zone ; aucun contenu n'est cloné ni déplacé.

## Chargement

Un seul logo du réseau avec un reflet discret peut apparaître au premier chargement. Les logos sont inclus dans le fichier : aucun asset Control à télécharger. Le site charge normalement derrière ce masque, qui disparaît dès que la messagerie est détectée, et au plus tard après six secondes pour ne jamais emprisonner l'utilisateur. Pas de chargement Control rejoué à chaque conversation. L'animation respecte le réglage de réduction des mouvements. Les temps de chargement des serveurs Instagram/Snapchat ne peuvent pas être supprimés par ce script.

Le logo Instagram est en **contour multicolore, sans carré plein**. Son reflet est masqué sur le tracé du logo pour ne pas balayer le reste de l'écran.

Sur Snapchat : silhouette vectorielle jaune sur fond blanc, même en mode sombre, reflet limité au logo et disparition en fondu. Le tracé vient de [Simple Icons — Snapchat](https://github.com/simple-icons/simple-icons/blob/develop/icons/snapchat.svg) ; il est embarqué dans le script, sans requête externe au chargement.

## Correctifs 1.3.0

- Suppression du traitement trop large des textes qui pouvait déformer les avatars : emplacement de 54 px pour l'avatar, zone séparée pour nom et statut, badges contenus et offsets des listes virtualisées conservés.
- La caméra s'étend dans ses cadres internes ; les marges, tailles et arrondis desktop de ces cadres sont retirés sur mobile. La vidéo native couvre la zone disponible. Safari conserve ses propres barres système.
- Les onglets sont plus discrets : seul le fond de l'icône active est jaune ; transition en fondu du contenu sans relancer le chargement.
- Le compteur connu `ControlUsageTimer` est masqué sur Snapchat. Si une autre extension Control est active, la désactiver pour ce site pendant l'utilisation de ce script : ses propres injections ou styles peuvent encore interférer. Ce script ne peut pas désinstaller une autre extension Safari.
- Tests supplémentaires avec avatars et boutons imbriqués, marges caméra desktop, lignes virtualisées et réduction des animations, à 320, 390 et 430 px. Ce sont des pages de test, pas le DOM réel du compte Snapchat sur iPhone.

## Snapchat

- Accès aux conversations, caméra et galerie/Memories lorsque Snapchat Web les propose.
- Masquage de Spotlight, Stories, Discover, carte et panneaux publics détectés.
- Jusqu'à 700 px, deux boutons fixes en bas : **Messages** pour la liste blanche pleine largeur et **Snap** pour le panneau caméra natif plein écran, au-dessus de la barre. La zone tient compte de l'espace sécurisé iPhone et du clavier.
- Le rail étroit d'avatars est reconnu et élargi. Les noms déjà présents dans le DOM sont rendus visibles. S'ils sont uniquement disponibles dans le titre ou le libellé accessible du contact, ce libellé est affiché. Aucun nom n'est inventé.
- Les vrais contacts, avatars, événements et messages de Snapchat sont conservés. Choisir un contact ouvre sa conversation ; le bouton Messages permet de retrouver la liste.
- L'onglet Snap affiche le panneau caméra détecté, sans ouvrir automatiquement la caméra, demander de permission ou envoyer de Snap. L'utilisateur utilise ensuite les commandes natives. Si aucun panneau caméra n'est détecté, l'onglet est désactivé, sans simuler une caméra fonctionnelle.
- La présentation desktop n'utilise pas cette barre mobile.
- La présentation s'adapte aux conteneurs reconnus. Si Snapchat change sa structure, certains ajustements peuvent nécessiter une mise à jour.

## Autres réseaux conservés

Facebook/Messenger, Reddit et X/Twitter restent en mode messages. Leurs pages de connexion restent accessibles. Les pages de découverte redirigent directement vers leur messagerie.

## Limites importantes

Ce fichier est un userscript pour l'extension Userscripts dans Safari, pas une application iOS ni une extension Chrome. Il ne modifie PAS les applications natives Instagram ou Snapchat. Si Snapchat refuse Safari sur votre iPhone, ce script ne peut pas activer un service indisponible. Il ne supprime pas des messages privés ni n'analyse leur contenu et ne garantit pas de filtrer tout contenu nocif.

Les règles sont fixes dans cette édition : pas de synchronisation PC, de limites quotidiennes ni d'authentification Control. La désactivation de Userscripts contourne le filtrage. La lecture vidéo dépend aussi des fonctions natives du réseau.

Validation : tests automatisés sur pages simulées, sans accès à un compte réel. Une vérification sur un vrai iPhone reste nécessaire ; aucune modification des applications iOS natives n'est annoncée.
