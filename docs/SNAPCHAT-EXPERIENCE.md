# Snapchat — audit et intégration 0.35.3 / iPhone 1.6.3

## Mode iPhone 1.6.3

Le userscript livré active `messagesOnly` : pas de section caméra, de navigation inférieure, de raccourci photo ni de bouton flottant de nouveau chat. La galerie, la réponse et la lecture des médias reçus restent natives. Le module partagé conserve le comportement ordinateur ; seul l'adaptateur iPhone active ce mode.

Les tests `check-snap-messages.cjs` exécutent le fichier livré sans modification à 320, 390 et 430 px : noms tardifs et recyclés, trois portraits, mise à jour d'un groupe, absence des raccourcis retirés, conversation pleine hauteur, envoi/galerie/vidéo natifs et retour à la liste. Captures inspectées. Les anciens tests de caméra basculent explicitement en mode historique ; ils ne valident pas l'interface livrée par défaut. Aucun essai sur Safari iPhone connecté n'est revendiqué.

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

Ensuite : aucune correction pour le simple décodage d’une image. Un nouveau message suit le bas en 180 ms si la distance était inférieure à 100 px ; un geste manuel interrompt ce suivi. Le lecteur remonté conserve sa position et voit « New message ». Une insertion en tête conserve l’élément visible à la même hauteur. Le redimensionnement du conteneur/clavier conserve le bas uniquement pour un lecteur déjà au bas. Les changements rapides A → B annulent les callbacks d’A.

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

Pour les appels reconnus : surface verticale 9:16 centrée sur ordinateur, participant distant dominant, cadrage intégral en contain, aperçu local compact vertical en contain, commandes natives en superposition. La caméra hors appel sur mobile utilise désormais un remplissage centré (voir 1.6.2).

Les dimensions et le zoom des flux d'appel sont lus, jamais modifiés par l'adaptateur d'appel. Aucun getUserMedia supplémentaire, stop de piste ou clonage de flux. L’accès aux sources et la fin d’appel restent natifs. Les erreurs d’autorisation sont dérivées des messages natifs reconnus ; Control ne contourne pas les autorisations du navigateur. Seul l'aperçu caméra mobile hors appel demande des dimensions idéales depuis 1.6.2.

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

## Passe ciblée 1.6.1

`SnapchatEssentialUI.js` complète le contrôleur commun sans déplacer les composants natifs : filtrage des distractions hors historique, caméra portrait, SVG locaux sémantiques, recherche locale des conversations actuellement chargées, groupes de paramètres et styles de notifications sur panneaux reconnus. Pas de demande réseau supplémentaire pour ces icônes.

Le composer est identifié une fois par combinaison panneau/historique/input. Les marqueurs sont conservés pendant la frappe ; les mutations d'attributs dans le composer ne relancent pas un scan structurel. Les contrôles natifs gardent leurs gestionnaires. La caméra existante reste propriétaire de son flux ; le script ne peut pas promettre une source physique portrait si la webcam fournit du paysage.

Vérifié automatiquement à 390 et 1280 px : focus puis 20 caractères = aucune variation du Y du composer, du scroll ou du compteur de reconstruction ; envoyer/recevoir au bas ; remonter 30 messages ; nouvel entrant sans saut ; bouton de retour au bas ; recherche nom/username et ouverture native ; icônes des dix lignes de paramètres testées ; conservation d'un timestamp natif ; états hidden ; caméra contain et miroir frontal ; nettoyage à la désactivation. Captures inspectées dans build/snap-experience. Les suites historiques couvrent aussi 320/430 px, le clavier redimensionné et Instagram. Aucune erreur JS ou ressource HTTP >=400 dans ces fixtures. Ce n'est pas une mesure de FPS sur Snapchat réel.

Limites explicites : recherche locale limitée aux contacts montés (la recherche serveur native reste disponible) ; aucun faux message, faux résultat ou réglage inventé ; panneaux/settings en dehors des sélecteurs reconnus non garantis ; notifications sans champs natifs non complétées par des données fictives ; pas de validation réseau de tous les assets Snapchat privés. Le navigateur connecté était indisponible pendant cette passe.

## Régressions corrigées en 1.6.2

Le test `check-snap-regressions.cjs` échouait sur quatre points avant correction : marqueur caméra sur un panneau devenu conversation ; lecteur reçu imbriqué non détecté ; marqueurs de conversation encore présents au retour aux contacts ; quatre marqueurs conservés après stopConversation. Il passe après correction, avec clic vidéo natif avant loadeddata, masque aria-hidden, retour puis ouverture d'une autre conversation et nettoyage du lecteur.

La capture fournie montre une source paysage contenue dans une surface portrait, avec bandes noires. À la demande de remplissage mobile, Control demande une seule fois par piste locale une préférence portrait via applyConstraints, en conservant deviceId/frameRate et sans nouvelle caméra. Le rejet est toléré. Le remplissage CSS mobile recadre si le navigateur n'accorde pas le portrait ; aucune rotation 90° arbitraire. À la désactivation, seules les contraintes encore identiques à celles de Control sont restaurées. Les pistes et l'envoi natif ne sont jamais arrêtés/remplacés. Référence : [MediaStreamTrack.applyConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/applyConstraints).

Tests simulés : demande portrait unique, deviceId préservé, aucun stop de piste, restauration des contraintes, object-fit cover mobile / contain ordinateur, retrait des raccourcis Lenses/My Story et maintien du déclencheur. La vignette réelle sans libellé ne peut pas être identifiée avec certitude à partir d'une capture seule. WebKit n'est pas installé ici : les tests restent Edge/Chromium, non une validation iPhone.

## Validation restante avant garantie de production

Sur un compte Snapchat de test, avec deux appareils : vérifier les vrais sélecteurs du lecteur et des appels, une série de Snaps réellement reçus, médias lents/échoués, refus puis autorisation caméra, appels entrants/sortants, source caméra, très longues discussions virtualisées et Safari iPhone physique.

Sans cette observation, la file universelle et la refonte complète des appels ne doivent pas être présentées comme validées en production.
