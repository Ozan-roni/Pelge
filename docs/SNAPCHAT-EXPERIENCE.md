# Snapchat — audit et intégration 0.35.0 / iPhone 1.6.0

## Périmètre réel

Une couche de présentation au-dessus du site natif Snapchat, commune à l’extension ordinateur et au userscript Safari. Ce n’est ni un client Snapchat indépendant, ni une API de lecture des messages. Aucun message, identité ou média n’est envoyé à Control. Les identités connues restent en mémoire, au maximum 500 entrées.

## Audit de la version 1.5.0

- La clé de discussion concaténait le chemin et le texte entier de l’en-tête. Un statut « écrit… » pouvait provoquer une nouvelle session.
- Le contrôleur de défilement réobservait chaque enfant à chaque mutation et pouvait repositionner la discussion à chaque redimensionnement de message.
- L’observateur global du userscript rescanait aussi les mutations de messages, de lecteur et de ses propres éléments.
- Les noms provenaient principalement de feuilles textuelles, sans cache par identifiant de conversation.
- Le lecteur reçu était seulement agrandi : pas de session, ni de gestion des chargements tardifs.
- Pas de couche de présentation dédiée aux appels.
- Des conteneurs natifs importants sont pilotés par Snapchat. Les cloner, les déplacer ou demander un deuxième flux caméra risquerait de casser ses événements et ses états.

## Architecture

- dist/scripts/SnapchatExperience.js : sélecteurs centralisés, cache d’identité, un contrôleur de défilement par session, transitions de disponibilité, lecteur et appels.
- dist/scripts/SnapchatVisuals.js : adaptateur ordinateur, activation par le réglage Snapchat existant et restauration à la désactivation.
- mobile/Control-iPhone.user.js : adaptation Safari existante conservée, ancienne ancre remplacée par le module commun.
- scripts/build-snapchat.cjs : génération mécanique du module dans le script autonome. --check détecte une divergence.

Les observateurs messages, lecteur et appel sont limités à leur surface, leurs listeners sont annulés par AbortController. Les changements structurels sont regroupés par animation frame. Les recherches de l’ancre visible font O(log n) lectures de rectangles pour des messages verticalement ordonnés. Les filtres historiques de l’extension gardent leurs propres observateurs : la mesure ci-dessous concerne le nouvel adaptateur, pas une disparition de tous les scans du produit.

## Défilement

Ouverture : attendre un contenu et trois mesures stables, puis positionner au bas une seule fois. L’identité de session ne dépend plus du texte de l’en-tête.

Ensuite : aucune correction pour le simple décodage d’une image. Un nouveau message suit le bas si la distance était inférieure à 80 px. Une insertion en tête conserve l’élément visible à la même hauteur. Le redimensionnement du conteneur/clavier conserve le bas uniquement pour un lecteur déjà au bas. Les changements rapides A → B annulent les callbacks d’A.

Les listes virtualisées qui remplacent intégralement leurs enfants sans identifiants exploitables nécessitent encore une vérification du contrat réel. Nous ne pouvons pas garantir une ancre sur un nœud déjà supprimé par Snapchat.

## Lecteur

États : IDLE, LOADING, READY, PLAYING, TRANSITIONING, FINISHED, CLOSING, ERROR.

Une surface native reconnue reste montée. Les contrôles suivant/précédent/fermer restent ceux de Snapchat. Control ne capture rien et n’appelle pas d’API privée. Le clic sur une commande native n’est pas intercepté. Le clavier ne remplace pas les raccourcis déjà consommés par le site.

La file et les segments ne sont montrés que si des identifiants de Snaps sont réellement présents. Les vidéos utilisent leurs événements et leur durée ; les photos utilisent uniquement une durée exposée. Les photos s’arrêtent en arrière-plan ou pendant un appel. Les fins de vidéo laissent Snapchat avancer d’abord, avec vérification de la session pour éviter un double saut.

Non réalisé / non garanti :

- découverte de tous les Snaps non lus quand Snapchat ne les expose pas dans le DOM ;
- téléchargement ou double-buffer de Snaps privés non encore ouverts ;
- préchargement vidéo réseau indépendant ;
- enchaînement universel sur tous les contrats DOM Snapchat.

Seules les images suivantes déjà chargées sont décodées en avance. Sans commandes natives reconnues, le comportement du site reste disponible, sans file fictive.

## Appels

Pour les surfaces reconnues : participant distant dominant, cadrage sans déformation, contain si cover retirerait plus de 15 % de l’image, aperçu local compact en contain, commandes natives en superposition.

Les dimensions et le zoom du flux local sont lus, jamais modifiés. Aucun getUserMedia supplémentaire, applyConstraints, stop de piste ou clonage de flux. L’accès aux sources et la fin d’appel restent natifs. Les erreurs d’autorisation sont dérivées des messages natifs reconnus ; Control ne contourne pas les autorisations du navigateur.

Pas de déplacement de l’aperçu local, pas de masquage automatique des commandes risquant de nuire au clavier. Les appels entrants réels, la sélection d’un appareil et les changements tardifs d’autorisations nécessitent encore un essai connecté.

## Disponibilité et rendu

La conversation est masquée pendant son positionnement puis révélée en 180 ms. L’indicateur est réutilisable et discret, pas une deuxième page de chargement. Un délai de sécurité rend l’interface native accessible si le contrat n’est pas reconnu, plutôt que de bloquer indéfiniment.

L’adaptateur ne promet pas de supprimer le délai réseau ni tous les états intermédiaires de Snapchat. La préparation complète de chaque caméra et chaque avatar natif n’est pas garantie. Le lecteur reste sombre pendant la préparation des médias, avec un message en cas d’erreur.

## Validation effectuée

Commandes :

    npm test
    npm run build:snapchat
    npm run test:snapchat
    npm run test:iphone

Navigateurs : Edge/Chromium isolé, sans compte connecté. Les fixtures reproduisent les contrats DOM ; les événements vidéo, erreurs de permissions et pistes sont simulés. Les captures ne représentent pas un vrai appel.

Cas couverts :

- 10 et 3 000 messages, ouverture une fois, en-tête mutable, lecture manuelle, insertion en tête, nouvel entrant au bas ou pendant lecture, changement de hauteur d’un média ;
- A → B rapide, valeur « . », remontage avec ID stable et recyclage avec un autre ID ;
- 1, 2 et 6 Snaps ; photo/photo, photo/vidéo, vidéo/photo, vidéo/vidéo ;
- événement natif qui avance déjà, flèches, Escape, chargement tardif d’une ancienne session, média en erreur, file inconnue ;
- cadrage local/distant et absence d’arrêt/modification des pistes ;
- désactivation de l’adaptateur sans marqueurs résiduels ;
- 20 changements de texte dans une discussion : 0 nouveau scan structurel par le nouvel adaptateur ;
- suite mobile existante : contacts, groupes, statuts, navigation, caméra native, historique, clavier redimensionné, modes clair/sombre, Instagram et routes d’authentification.

## Validation restante avant garantie de production

Sur un compte Snapchat de test, avec deux appareils : vérifier les vrais sélecteurs du lecteur et des appels, une série de Snaps réellement reçus, médias lents/échoués, refus puis autorisation caméra, appels entrants/sortants, source caméra, très longues discussions virtualisées et Safari iPhone physique.

Sans cette observation, la file universelle et la refonte complète des appels ne doivent pas être présentées comme validées en production.
