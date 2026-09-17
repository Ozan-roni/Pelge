# Control iPhone — Safari 1.5.0

Cette édition complète remplace les versions précédentes. Aucun menu Control ni page de remplacement : les sites natifs restent affichés, avec deux onglets de navigation sur Snapchat mobile. Aucun serveur Control ni PC allumé n'est nécessaire.

## Installation / mise à jour

La version **1.5.0** est disponible dans le fichier complet ci-dessous.

Fichier source en ligne : https://raw.githubusercontent.com/Ozan-roni/Pelge/main/mobile/Control-iPhone.user.js

Ouvrir ce lien dans Safari et utiliser l'installation proposée par Userscripts. Remplacer la version existante, puis recharger les onglets. Vérifier que la version installée est **1.5.0**. Une mise à jour sur GitHub ne remplace pas automatiquement un script déjà installé sur l'iPhone.

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

Sur Snapchat : silhouette vectorielle jaune assombrie sur fond blanc, même en mode sombre, reflet limité au logo et disparition en fondu. Le tracé vient de [Simple Icons — Snapchat](https://github.com/simple-icons/simple-icons/blob/develop/icons/snapchat.svg) ; il est embarqué dans le script, sans requête externe au chargement.

## Correctifs 1.5.0

- Échelle adaptée à la largeur de l’iPhone, y compris quand Safari charge la version pour ordinateur. Pleine largeur utile pour Snapchat et Instagram sur grand écran, sans étirer les fenêtres de connexion. Les barres Safari restent gérées par iOS ; le script ne peut pas imposer le plein écran système.
- Blocage du débordement horizontal de la page, défilement vertical conservé. Glissement horizontal entre Messages et caméra, sans déclencher la prise de vue. Les champs, menus, lecteurs et zones natives défilant horizontalement ne sont pas interceptés. Portrait et paysage sont pris en charge ; le zoom tactile reste autorisé.
- Logo Snapchat un peu plus sombre et reflet atténué. Les transitions de navigation restent en fondu et respectent la réduction des animations.
- Barre inférieure : contours noirs, icône pleine pour l’onglet actif, aucun texte visible.
- En-tête compact avec titre Chat, recherche, profil, notifications, ajouts et options lorsque ces commandes existent dans le site. Le bouton natif de nouvelle conversation apparaît en bas à droite ; à défaut, un raccourci vers la recherche native est proposé si celle-ci est détectée. Aucune commande de notification ou d’ajout factice.
- Noms et statuts séparés, accents et textes natifs conservés ; les longs statuts peuvent occuper deux lignes. L’ordre natif et les offsets des listes virtualisées sont conservés, sans tri inventé.
- Avatars composés à deux ou trois personnes lorsqu’il existe plusieurs portraits ; les badges restent distincts.
- Icône appareil photo à droite de chaque contact reconnu. La commande native est utilisée en priorité. Si elle manque dans la liste, le raccourci ouvre la conversation sélectionnée puis sa caméra de pièce jointe uniquement lorsque le nom correspond et que la commande est reconnue. Sinon un message indique la limite. Aucun appel, déclenchement photo ou envoi automatique.
- Ouverture des discussions au dernier message, y compris après un chargement différé ou un changement de hauteur du clavier. Les nouveaux messages suivent le bas seulement tant que l’utilisateur n’est pas remonté lire l’historique.
- Les lecteurs natifs de Snaps reçus reconnus sont conservés au premier plan, avec leurs boutons de fermeture. Cela ne déverrouille pas un Snap que Snapchat ne fournit pas au navigateur. Les Memories ne sont pas rendues accessibles par ce script : [limites officielles du Web](https://help.snapchat.com/hc/en-gb/articles/39147590589460-Which-features-can-I-use-in-the-Snapchat-app-that-aren-t-available-yet-on-the-web).
- Les lignes inchangées ne sont pas reconstruites pendant le défilement ; les boutons caméra suivent les lignes visibles. Les tests utilisent des pages simulées, sans connexion à un compte Snapchat et sans lire de vrais Snaps.

## Correctifs 1.4.1

- Correction ciblée de l'intérieur des conversations : la barre caméra/saisie/emoji/galerie conserve sa disposition native horizontale, en bas de la discussion.
- Seuls les cadres extérieurs de l'historique sont redimensionnés. Les boutons et les parents internes du champ de saisie ne sont plus forcés en colonnes pleine hauteur.
- La caméra de pièce jointe d'une discussion n'est plus traitée comme le panneau caméra plein écran ; les anciennes marques de dimensionnement sont retirées d'un panneau réutilisé.
- Les couleurs natives des textes sont préservées, notamment sur fond sombre. L'historique garde son défilement indépendant.
- Tests de régression sur barre imbriquée et historique avec/sans rôle accessible, à 320, 390 et 430 px, puis avec hauteur réduite à 480 px. Ces simulations ne remplacent pas un essai réel du clavier Safari sur iPhone.

## Correctifs précédents (1.4.0)

- Noms des contacts reconnus aussi dans les titres natifs : la place disponible leur est réservée, avec le statut compact sur une ligne en dessous.
- Navigation du bas avec deux icônes uniquement ; les libellés restent accessibles aux lecteurs d'écran.
- Dans une discussion, navigation masquée et conversation étendue sans cadre blanc. Le retour natif réaffiche la liste et les deux icônes.
- Fond illustré de démarrage caméra remplacé par une surface sobre pleine hauteur. Un appui volontaire sur Snap utilise le bouton natif de démarrage reconnu ; aucun déclenchement de photo ni envoi automatique.
- Vérification automatisée supplémentaire des titres masqués, statuts imbriqués, discussions pleine hauteur et retour natif, à 320, 390 et 430 px. La caméra réelle et Safari sur iPhone restent à vérifier sur l'appareil.

## Correctifs précédents (1.3.0)

- Suppression du traitement trop large des textes qui pouvait déformer les avatars : emplacement de 54 px pour l'avatar, zone séparée pour nom et statut, badges contenus et offsets des listes virtualisées conservés.
- La caméra s'étend dans ses cadres internes ; les marges, tailles et arrondis desktop de ces cadres sont retirés sur mobile. La vidéo native couvre la zone disponible. Safari conserve ses propres barres système.
- Les onglets sont plus discrets : seul le fond de l'icône active est jaune ; transition en fondu du contenu sans relancer le chargement.
- Le compteur connu `ControlUsageTimer` est masqué sur Snapchat. Si une autre extension Control est active, la désactiver pour ce site pendant l'utilisation de ce script : ses propres injections ou styles peuvent encore interférer. Ce script ne peut pas désinstaller une autre extension Safari.
- Tests supplémentaires avec avatars et boutons imbriqués, marges caméra desktop, lignes virtualisées et réduction des animations, à 320, 390 et 430 px. Ce sont des pages de test, pas le DOM réel du compte Snapchat sur iPhone.

## Snapchat

- Accès aux conversations, caméra et galerie/Memories lorsque Snapchat Web les propose.
- Masquage de Spotlight, Stories, Discover, carte et panneaux publics détectés.
- Jusqu'à 700 px, deux icônes fixes en bas (également en paysage tactile jusqu’à 950 px de large et 600 px de haut) : **Messages** pour la liste blanche pleine largeur et **Snap** pour le panneau caméra natif plein écran, au-dessus de la barre. La navigation disparaît dans les discussions. La zone tient compte de l'espace sécurisé iPhone et du clavier.
- Le rail étroit d'avatars est reconnu et élargi. Les noms déjà présents dans le DOM sont rendus visibles. S'ils sont uniquement disponibles dans le titre ou le libellé accessible du contact, ce libellé est affiché. Aucun nom n'est inventé.
- Les vrais contacts, avatars, événements et messages de Snapchat sont conservés. Choisir un contact ouvre sa conversation ; le bouton Retour natif permet de retrouver la liste.
- Un appui volontaire sur l'icône Snap affiche le panneau caméra détecté et active sa commande native de démarrage si elle est reconnue. Safari peut alors demander l'autorisation caméra. Aucune caméra n'est démarrée au chargement de la page ; aucune photo ni aucun message ne sont envoyés automatiquement. Les commandes de capture et d'envoi restent celles de Snapchat. Si aucun panneau caméra n'est détecté, l'onglet est désactivé, sans simuler une caméra fonctionnelle.
- La présentation desktop n'utilise pas cette barre mobile.
- La présentation s'adapte aux conteneurs reconnus. Si Snapchat change sa structure, certains ajustements peuvent nécessiter une mise à jour.

## Autres réseaux conservés

Facebook/Messenger, Reddit et X/Twitter restent en mode messages. Leurs pages de connexion restent accessibles. Les pages de découverte redirigent directement vers leur messagerie.

## Limites importantes

Ce fichier est un userscript pour l'extension Userscripts dans Safari, pas une application iOS ni une extension Chrome. Il ne modifie PAS les applications natives Instagram ou Snapchat. Si Snapchat refuse Safari sur votre iPhone, ce script ne peut pas activer un service indisponible. Il ne supprime pas des messages privés ni n'analyse leur contenu et ne garantit pas de filtrer tout contenu nocif.

Les règles sont fixes dans cette édition : pas de synchronisation PC, de limites quotidiennes ni d'authentification Control. La désactivation de Userscripts contourne le filtrage. La lecture vidéo dépend aussi des fonctions natives du réseau.

Validation 1.5.0 : suites automatisées sur pages simulées sous Chromium et WebKit, sans accès à un compte réel. Largeurs 320, 390, 430, 700, 1280 et 1440 px selon les scénarios, paysage 844 × 390 et hauteur de clavier simulée de 480 px. Une vérification sur un vrai iPhone reste nécessaire ; aucune modification des applications iOS natives n'est annoncée.
