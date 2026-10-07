# Mise à jour Control 0.35.9 — contrôles natifs Snapchat

Script Safari **1.6.9** : compte SVG extérieur à la liste, appui direct sur les paramètres natifs, boutons Voir avec libellé externe, raccrocher carré et centré. Le statut d’appel ne bloque plus les contrôles. Cadrage caméra inchangé.

# Mise à jour Control 0.35.8 — chat Snapchat mobile

Correspondance avec le script Safari **1.6.8**. Mise en page corrigée d'après les captures fournies : liste seule, paramètres en haut à droite, statuts et zones d'appui alignés, avatars et groupes proportionnés. Les conversations, snaps, menus et retours conservent les actions natives.

Caméra naturelle et blocage du défilement Instagram conservés. Sur iPhone, remplacer le script existant et garder un seul Control actif ; sur PC, recharger l'extension et les onglets.

# Mise à jour Control 0.35.7 — caméra naturelle et vidéo Instagram unique

Snapchat conserve le cadrage complet de la caméra et des aperçus de pièces jointes sur téléphone, en portrait et paysage. Control ne force plus une résolution 1080×1920 ni un ratio de capture 9:16. Les paramètres de caméra et le flux natifs restent inchangés ; le miroir avant ne se cumule pas avec celui de Snapchat.

Instagram bloque le défilement vertical après l'ouverture volontaire d'une vidéo, notamment depuis un profil. Les gestes tactiles, la molette, les touches de défilement et les conteneurs imbriqués ou ajoutés tardivement sont couverts. Le lecteur choisi, ses contrôles et la saisie restent utilisables. Les vidéos préchargées hors écran ne remplacent pas la vidéo choisie. Le retour aux messages ou la désactivation restaure le défilement.

Validation : `npm run test:media-focus`, tests généraux de l'extension, messagerie Instagram, expérience et régressions Snapchat, messagerie mobile, lecteur média natif et parcours iPhone simulés dans Chrome/Edge. Les tests interceptent toutes les requêtes et génèrent leurs médias localement ; la validation sur Safari iPhone physique reste à faire.

Édition Safari correspondante : **1.6.7**. Sur PC, recharger l'extension puis les onglets. Sur iPhone, remplacer le script Control existant dans Userscripts et recharger Safari.

## Historique 0.35.6 — Facebook sur PC

Quand Facebook est activé et que « Photos and messages only » ou l'ancien réglage `DMsOnly` est actif, les profils ouvrent leur onglet Photos. La recherche de personnes, les galeries, le lecteur photo natif, les messages, la connexion et les réglages restent accessibles. Les fils d'accueil alternatifs, publications de profils, groupes, Watch, Reels, Stories et découverte sont bloqués. Les galeries et les conversations peuvent défiler ; les fils bloqués ne le peuvent pas.

La désactivation de Facebook dans Control restaure la page. Aucun changement forcé des applications choisies ni des limites de temps. Le filtrage ne peut plus être repoussé indéfiniment par les mutations d'un fil actif.

Validation : `npm test` et `npm run test:facebook` (Edge desktop, pages de test isolées). Le test couvre routes directes, navigation SPA/retour, lecteur photo, molette/clavier, désactivation et contenu ajouté en continu. La validation sur un compte Facebook réel reste à faire. Paquet local uniquement : le navigateur installé et GitHub ne sont pas mis à jour automatiquement.

## Historique 0.34.4

Les fenêtres natives Instagram (nouveau message, partage, etc.) conservent leur seul fond natif, sans cadre, ombre ou flou ajoutés sur les conteneurs parents. Leur ouverture reste en fondu.

À la demande de l'utilisateur, cette version active X/Twitter, Reddit et Facebook en mode messages uniquement au premier rechargement. Elle bloque aussi les accès directs aux fils, profils, communautés, vidéos et pages de découverte ; les messages, chats et pages de connexion/réglages restent accessibles. Les médias privés de X sont conservés. Le marqueur synchronisé `ControlSocialFocusApplied: 1` empêche de réappliquer le choix à chaque démarrage : les changements ultérieurs restent respectés. Les limites existantes et les autres applications restent inchangées. Les réglages X et Reddit affichent désormais Messages only.

Logo Instagram coloré avec une lueur qui le traverse (sans reflet miroir). Fondu lors d'un changement de conversation et à l'ouverture/focus de la recherche, sans déplacer la liste. Marge supplémentaire de 32 px sous les statuts. Le compositeur vocal natif reconnu par ses commandes d'arrêt/annulation/envoi devient une capsule compacte, avec commandes rondes ; progression, durée et actions natives sont conservées. Aucun accès au microphone n'est ajouté. Les variantes de DOM Instagram non reconnues gardent leur apparence native.

Le champ de message intérieur est explicitement transparent, sans seconde bordure ; le contour extérieur et les boutons natifs sont conservés. Toute l'interface apparaît en fondu pendant la disparition du loading (640 ms). La désactivation, la réduction des animations et la limite de chargement restaurent toujours la visibilité.

Une copie préparée dans `build/` ne suffit pas à mettre à jour une extension installée ailleurs. Avant de livrer une correction, identifier le chemin réellement chargé par Chrome, sauvegarder les fichiers concernés et y synchroniser les modifications. Garder la même clé et les mêmes permissions. Recharger l'extension lit ce dossier ; actualiser ensuite les onglets déjà ouverts remplace leurs anciens scripts.

Instagram : chargement avec logo, reflet discret et fondu ; fonds de messagerie unifiés ; suppression des cadres ajoutés aux champs et aux messages ; raccourcis Story/Note/Post intégrés au-dessus des statuts natifs lorsqu'ils sont identifiés. Les marges natives de la messagerie sont conservées pour éviter le chevauchement avec la navigation. Le compteur de temps reste inchangé.

La mise à jour du site ne remplace pas les fichiers de l’extension déjà installée.

1. Décompresser le nouveau paquet dans un dossier permanent.
2. Dans Chrome ou Edge, ouvrir la page Extensions et activer le mode développeur si nécessaire.
3. Pour une extension décompressée existante, remplacer ses fichiers par ceux du paquet puis cliquer sur Recharger. Ne pas désinstaller l’extension : cela peut effacer ses données locales.
4. Actualiser une fois les onglets Control et les réseaux sociaux déjà ouverts. Les anciens scripts peuvent avoir supprimé des éléments ; ce premier rechargement restaure leur page native.
5. Le site doit afficher « Extension connected ». « Saved locally » signifie que les choix ne sont pas transmis à l’extension dans ce navigateur.

Après la mise à jour, désactiver une application retire les effets de Control, le minuteur et les blocages de limite/global sur cette application. Les réglages sont conservés pour une réactivation. Une limite de zéro signifie illimité.

Vérifications locales : node extension/check.cjs et node extension/check-settings.cjs.
`npm run test:instagram` vérifie les scripts sur une messagerie simulée, en clair/sombre, l'alignement à plusieurs largeurs, la saisie, le passage au mobile, le nettoyage à la désactivation et la réduction des animations. Il nécessite Playwright et un navigateur (voir README), mais aucun serveur ou compte Instagram.
Les tests simulés ne remplacent pas une vérification sur un compte connecté au réseau social.
