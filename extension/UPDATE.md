# Mise à jour Control 0.34.4

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
