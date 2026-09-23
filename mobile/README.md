# Control iPhone — Safari 1.6.5

Cette édition complète remplace les versions précédentes. Aucun menu Control ni page de remplacement : les sites natifs restent affichés. Snapchat iPhone est désormais en mode messages uniquement, sans section caméra, onglets inférieurs ni bouton flottant de nouveau chat. Aucun serveur Control ni PC allumé n'est nécessaire.

## Installation / mise à jour

Cette édition contient la version **1.6.5**. Vérifier le champ `@version` avant l'installation, notamment si Safari affiche une copie en cache.

Fichier source en ligne : https://raw.githubusercontent.com/Ozan-roni/Pelge/main/mobile/Control-iPhone.user.js

Ouvrir ce lien dans Safari et utiliser l'installation proposée par Userscripts. Remplacer la version existante, puis recharger les onglets. Vérifier que la version installée est **1.6.5** et garder un seul script Control actif. Une mise à jour sur GitHub ne remplace pas automatiquement un script déjà installé sur l'iPhone.

## 1.6.5 — lecteur, portraits et réglages

- Un lecteur reçu reconnu est libéré des cadres de conversation qui le découpaient. Le contenu vidéo est sélectionné avant les images ; avatar de l'expéditeur et icônes de réaction exclus. Le lecteur apparaît en fondu sans fermer la conversation, et ses marqueurs temporaires sont retirés à la fermeture.
- Média centré en entier, commandes natives de fermeture, réactions et réponse séparées du média. Pas de copie du flux, de lecture forcée, ni de contournement des restrictions Safari/Snapchat.
- Bulles décoratives identifiables exclues des portraits. Bitmoji individuel centré ; un membre natif à l'avant et les autres derrière pour les groupes. Un portrait fourni reste nécessaire : aucun membre inventé.
- Logo Snapchat dans l'en-tête. Menus de paramètres séparés des lignes de contacts, glass clair/sombre compact et icônes SVG embarquées. Les actions restent natives.
- `check-snap-surfaces.cjs` reproduit les trois défauts sur la 1.6.4 et vérifie la correction à 320, 390 et 430 px, y compris fermeture du lecteur et clics natifs. Tests DOM simulés et captures inspectées sur Edge, **pas de validation sur un compte Snapchat connecté ni de décodage vidéo Safari iPhone réel**. Les sélecteurs restent dépendants du DOM fourni par Snapchat.

## 1.6.4 — actions Répondre et groupes mixtes

- Action native Répondre séparée du nom et du statut, alignée à droite sans sa décoration caméra. Son comportement reste natif : une action de réponse caméra n'est pas transformée artificiellement en commande de lecture.
- Silhouettes SVG et portraits image composés ensemble dans les groupes ; trois membres visibles si Snapchat fournit trois portraits, sans faux membre.
- Reconnaissance de lecteurs reçus supplémentaires, y compris une boîte vidéo avec commande de fermeture et une réponse. Un lecteur reçu n'est plus masqué parce qu'il est monté sous le panneau caméra masqué par Control.
- Champ de réponse du lecteur en bas, fermeture en haut, lecture native conservée. Aucun démarrage de caméra, capture ou envoi automatique.
- `check-snap-reply.cjs` couvre ces contrats à 320, 390 et 430 px. Captures simulées inspectées ; aucune lecture d'un vrai Snap ou validation Safari iPhone connecté revendiquée.

## 1.6.3 — messages uniquement sur iPhone

- Section caméra, navigation Messages/Snap, raccourcis photo des contacts et du champ de réponse, et bouton flottant de nouveau chat masqués.
- Conversation sur toute la hauteur disponible ; saisie, galerie, emoji et envoi natifs conservés. Les vidéos reçues restent ouvrables.
- Noms issus des métadonnées natives, titres ou identifiants disponibles ; mise à jour des lignes recyclées, sans identité inventée.
- Jusqu'à trois portraits natifs par groupe, y compris lorsqu'ils arrivent plus tard ; une image de groupe déjà composée reste entière. Aucun faux membre ajouté.
- Tests sur DOM simulé à 320, 390 et 430 px, avec inspection des captures. Pas encore testé sur un iPhone connecté à Snapchat.

Les notes caméra ci-dessous décrivent les versions précédentes ; elles ne correspondent plus au mode iPhone par défaut. Leurs tests restent conservés séparément du test du script réellement livré (`check-snap-messages.cjs`).

## Correctifs 1.6.2 — vidéos, retour aux contacts et caméra mobile

- Nettoyage des marqueurs de disposition à la fermeture d'une conversation et lors de la réutilisation du panneau caméra.
- Détection des lecteurs de vidéos reçues insérés dans l'historique ; clic natif conservé, y compris avant chargement des images vidéo.
- Aperçu caméra mobile sans bandes : demande portrait 1080 × 1920 idéale sur le flux local déjà ouvert et remplissage centré. Si Safari garde une source paysage, le remplissage recadre les côtés ; il ne peut pas créer un champ portrait sans recadrage ni garantir le cadrage de la capture native.
- Retrait des raccourcis Stories/Discover/Spotlight et effets/lenses reconnus dans la caméra, sans supprimer le déclencheur.
- Pas de nouvelle demande getUserMedia, de rotation arbitraire de l'image, d'arrêt de piste ou de capture automatique. Les contraintes originales sont restaurées à la désactivation si Snapchat ne les a pas modifiées entre-temps.

Tests de régression simulés validés, pas encore de validation sur Safari iPhone physique. Une pastille sans sélecteur ou libellé identifiable peut nécessiter une adaptation supplémentaire.

## Correctifs 1.6.1 — interface essentielle

- Composer séparé du défilement ; focus et saisie sans reconstruction de la discussion.
- Défilement doux de 180 ms uniquement près du bas ; bouton « New message » pendant la lecture d'anciens messages.
- Caméra et appels en portrait sur ordinateur, aperçu complet en `contain`, miroir limité au preview frontal local.
- Recherche des conversations chargées par nom/username, ouverture par les commandes natives.
- Icônes SVG cohérentes ; groupes de paramètres et notifications sur les panneaux natifs reconnus.
- Stories/Spotlight et rails vides masqués sans masquer l'historique des messages.

Les tests sont des scénarios DOM simulés sur Edge. Une vérification sur Snapchat connecté et Safari iPhone réel reste obligatoire avant de considérer l'intégration terminée.

## Correctifs 1.6.0 — sessions Snapchat

- Un contrôleur de défilement unique : positionnement initial après stabilisation, conservation de la lecture manuelle, suivi des nouveaux messages uniquement à proximité du bas, ancre conservée lors du chargement des anciens messages.
- Cache d’identités en mémoire, indexé par identifiant de conversation reconnu. Un point ou une valeur vide ne remplace plus un nom connu. Sans identifiant stable ni nom disponible : « Conversation », sans inventer un nom.
- Fondu de disponibilité de la discussion, indicateur discret et annulation des anciennes sessions.
- Adaptateur pour lecteurs et appels natifs reconnus, sans déplacer, cloner ni capturer leurs médias. Les commandes de lecture et les durées restent celles exposées par Snapchat.
- **Limites :** aucune API privée, aucune récupération d’une file de Snaps non exposée, aucun préchargement réseau de médias privés. Le décodage anticipé se limite aux images suivantes déjà fournies. L’enchaînement reste dépendant des commandes natives reconnues. Pas de garantie d’intégration réelle sur iOS sans essai sur un appareil connecté.

Voir [l’audit et les limites de validation](../docs/SNAPCHAT-EXPERIENCE.md). Le module commun est généré dans ce fichier autonome avec `npm run build:snapchat` ; il n’y a rien d’autre à installer sur le téléphone.

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

- Accès aux conversations, médias reçus et galerie de pièces jointes lorsque Snapchat Web les propose. Pas de section caméra ni d'accès Memories ajouté.
- Masquage de Spotlight, Stories, Discover, carte et panneaux publics détectés.
- Sur mobile, liste blanche pleine largeur puis conversation pleine hauteur, sans navigation inférieure. La zone tient compte de l'espace sécurisé iPhone et du clavier.
- Le rail étroit d'avatars est reconnu et élargi. Les noms déjà présents dans le DOM sont rendus visibles. S'ils sont uniquement disponibles dans le titre ou le libellé accessible du contact, ce libellé est affiché. Aucun nom n'est inventé.
- Les vrais contacts, avatars, événements et messages de Snapchat sont conservés. Choisir un contact ouvre sa conversation ; le bouton Retour natif permet de retrouver la liste.
- Les raccourcis caméra et le bouton flottant de nouveau chat sont masqués. Les commandes natives de galerie, emoji et envoi restent accessibles dans la discussion. Le script n'ouvre pas de flux caméra et ne prend ni n'envoie de photo automatiquement.
- L'extension ordinateur conserve son mode existant ; cette simplification est activée dans le userscript iPhone.
- La présentation s'adapte aux conteneurs reconnus. Si Snapchat change sa structure, certains ajustements peuvent nécessiter une mise à jour.

## Autres réseaux conservés

Facebook/Messenger, Reddit et X/Twitter restent en mode messages. Leurs pages de connexion restent accessibles. Les pages de découverte redirigent directement vers leur messagerie.

## Limites importantes

Ce fichier est un userscript pour l'extension Userscripts dans Safari, pas une application iOS ni une extension Chrome. Il ne modifie PAS les applications natives Instagram ou Snapchat. Si Snapchat refuse Safari sur votre iPhone, ce script ne peut pas activer un service indisponible. Il ne supprime pas des messages privés ni n'analyse leur contenu et ne garantit pas de filtrer tout contenu nocif.

Les règles sont fixes dans cette édition : pas de synchronisation PC, de limites quotidiennes ni d'authentification Control. La désactivation de Userscripts contourne le filtrage. La lecture vidéo dépend aussi des fonctions natives du réseau.

Validation 1.5.0 : suites automatisées sur pages simulées sous Chromium et WebKit, sans accès à un compte réel. Largeurs 320, 390, 430, 700, 1280 et 1440 px selon les scénarios, paysage 844 × 390 et hauteur de clavier simulée de 480 px. Une vérification sur un vrai iPhone reste nécessaire ; aucune modification des applications iOS natives n'est annoncée.
