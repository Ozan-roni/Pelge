# Control iPhone — Safari 1.1.0

Cette édition complète remplace le script 1.0.0. Aucun menu, bouton flottant Control ou page de remplacement : seuls les sites natifs restent affichés. Aucun serveur Control ni PC allumé n'est nécessaire.

## Installation / mise à jour

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

## Snapchat

- Accès aux conversations, caméra et galerie/Memories lorsque Snapchat Web les propose.
- Masquage de Spotlight, Stories, Discover, carte et panneaux publics détectés.
- Sur petit écran, la liste native des contacts occupe la largeur ; les noms, avatars et messages restent ceux de Snapchat, sans réplique ni collecte par Control.
- La présentation s'adapte aux conteneurs reconnus. Si Snapchat change sa structure, certains ajustements peuvent nécessiter une mise à jour.

## Autres réseaux conservés

Facebook/Messenger, Reddit et X/Twitter restent en mode messages. Leurs pages de connexion restent accessibles. Les pages de découverte redirigent directement vers leur messagerie.

## Limites importantes

Ce fichier est un userscript pour l'extension Userscripts dans Safari, pas une application iOS ni une extension Chrome. Il ne modifie PAS les applications natives Instagram ou Snapchat. Si Snapchat refuse Safari sur votre iPhone, ce script ne peut pas activer un service indisponible. Il ne supprime pas des messages privés ni n'analyse leur contenu et ne garantit pas de filtrer tout contenu nocif.

Les règles sont fixes dans cette édition : pas de synchronisation PC, de limites quotidiennes ni d'authentification Control. La désactivation de Userscripts contourne le filtrage. La lecture vidéo dépend aussi des fonctions natives du réseau.

Validation : tests automatisés sur pages simulées, sans accès à un compte réel. Une vérification sur un vrai iPhone reste nécessaire ; aucune modification des applications iOS natives n'est annoncée.
