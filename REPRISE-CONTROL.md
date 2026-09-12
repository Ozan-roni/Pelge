# Reprise de Control dans VS Code

## Correction après capture utilisateur — 0.34.2

La copie réellement chargée dans Chrome était encore en 0.34.0 ; sa règle `contenteditable` ajoutait le fond gris et une seconde bordure visibles dans la capture. La préparation d'un nouveau dossier 0.34.1 n'avait donc pas modifié l'extension utilisée. Pour les prochaines interventions : identifier et mettre à jour le dossier réellement installé, avec sauvegarde, au lieu de livrer uniquement un nouveau paquet. Ne pas modifier les profils Chrome ou désinstaller l'extension.

Le champ de saisie intérieur devient explicitement transparent et sans bordure ; le contour extérieur natif reste intact. Le loading masque le contenu en attente, puis toute la page (navigation incluse) apparaît pendant son fondu de sortie de 640 ms. La visibilité est restaurée aussi à la désactivation, au délai maximal et à la réduction des animations. Le test Instagram reproduit maintenant un champ gris avec bordure, vérifie son nettoyage, la conservation du contour extérieur et une opacité intermédiaire sur le corps de page.

La copie installée de Chrome a été mise à jour en 0.34.2 : les six fichiers livrés ont les mêmes empreintes que le paquet testé, clé et permissions inchangées. Sauvegarde des anciens fichiers dans `build/installed-backup-before-0.34.2/`. Le navigateur Chrome utilisateur n'est pas connecté au contrôle UI ; le rechargement effectif de l'extension et de l'onglet Instagram reste à effectuer par l'utilisateur.

## Interface Instagram — 0.34.1

La clarification utilisateur concerne les statuts/notes au-dessus des messages, pas le compteur de temps Control. Les raccourcis flottants sont désormais intégrés dans cette zone lorsqu'elle est reconnue ; aucun panneau supplémentaire n'est affiché par-dessus l'en-tête sinon. Les anciennes marges forcées, cadres de champs et décorations fondées sur les mots des messages ont été retirés. Les fonds de messagerie sont unifiés avec le thème natif. Le compteur reste inchangé.

`dist/scripts/InstagramVisuals.js` et `dist/styles/InstagramVisuals.css` ajoutent le chargement avec logo embarqué, reflet et fondus, sans répétition pendant la navigation interne. Le chargement disparaît dès que la page est prête, avec une limite de six secondes, et respecte la réduction des animations. Le manifeste charge ces fichiers.

`npm run test:instagram` fonctionne sans serveur, avec toutes les requêtes Instagram interceptées par une fixture locale. Il couvre les thèmes, les surfaces natives des messages et de la saisie, l'absence de chevauchement avec la navigation à 1024/1280/1440 px, le retour au mobile, les transitions et la désactivation. Captures dans `build/instagram-verification/`. Aucun navigateur utilisateur connecté n'était disponible pour vérifier le véritable DOM Instagram : une vérification après mise à jour de l'extension reste nécessaire. Voir `extension/UPDATE.md`.

## Demande reprise et implémentée le 12 septembre 2026

- Adapter toutes les interfaces au mobile : navigation inférieure flottante glass, zones tactiles confortables, lisibilité en modes clair et nocturne, transitions douces et beau chargement respectant la réduction des animations.
- Applications : vraies icônes de marque, notamment Reddit, Threads et Facebook ; choix persistant entre grille, liste et grandes cartes défilantes avec informations et contrôles utiles, sur mobile et ordinateur.
- Ajouter Administration : écran « Setup your admin account », dashboard, feedback, support, logs et codes promotionnels. Reprendre l'intention de la référence de sécurisation du compte, dans la marque Control. Ne pas prétendre qu'une interface locale constitue une authentification administrateur sécurisée.
- Ajouter Contact us et Donation. L'utilisateur demande explicitement des placeholders pour l'adresse e-mail et le lien de don ; aucun envoi réel ni paiement actif.
- Sauvegarder le projet sur GitHub et documenter sa reprise sur un autre appareil. Vérifier l'envoi, ne pas le considérer acquis.

## État du développement

Les interfaces ont été adaptées : barre mobile flottante, menu More, cibles tactiles, thèmes clair/nocturne sur l'espace logiciel, l'accueil et la connexion, chargement raccourci et respect de la réduction des animations CSS et JavaScript.

Applications propose Grid, List et Cards, avec recherche, choix enregistré et contrôles existants. Les SVG de marque sont embarqués ; Reddit et Facebook ont retrouvé leurs couleurs. Threads utilisait déjà le tracé de Simple Icons, vérifié pendant cette reprise.

Administration propose le setup du profil local, un dashboard, les feedbacks enregistrés depuis Contact, le support existant, un journal local limité à 200 événements et des codes promotionnels au stade de brouillons (création, archivage, contrôle des doublons). Aucune authentification administrateur serveur n'est implémentée ; l'interface l'indique. Les données restent dans le navigateur.

Contact contient `[CONTACT_EMAIL]` ; Donation contient `[DONATION_LINK]` avec un bouton désactivé. Aucun envoi ni paiement actif.

Le code du site et de l'extension est dans `dist/`. L'interface logiciel est dans `dist/scripts/ControlStudio.js` et `dist/styles/ControlStudio.css`. Les ajouts sont dans `dist/scripts/ControlAdmin.js` et `dist/styles/ControlResponsive.css`. Les définitions d'applications et chemins des icônes sont dans `dist/scripts/Dashboard.js`. Conserver les fonctionnalités existantes et les modifications de l'utilisateur.

Commandes : `npm run dev`, `npm test`, `npm run package:extension`, et le nouveau `npm run test:ui`. Ce dernier demande `npm ci` puis `npx playwright install chromium` (voir README). Le serveur local utilise http://127.0.0.1:8788/ ; vérifier l'existant avant d'en lancer un deuxième.

Le dépôt distant est https://github.com/Ozan-roni/Pelge.git, branche `main`. La présence distante du précédent commit `26215d7` a été confirmée pendant cette reprise. Pour vérifier toute nouvelle sauvegarde, comparer `git rev-parse HEAD` et `git ls-remote origin refs/heads/main` : les identifiants doivent correspondre. Ne jamais forcer le push. La réponse finale de cette intervention rapporte le résultat du nouvel envoi.

L'hébergement Sites existant possède sa configuration dans `.openai/hosting.json`. GitHub et le déploiement du site sont distincts. Respecter les instructions de publication applicables et les droits d'accès existants.

## Protections à préserver

Après activation d'une application, sa désactivation nécessite Settings → « Rechoose your protection application », avec pause de cinq minutes et exercice de saisie optionnel. Une limite quotidienne égale à zéro signifie Unlimited. Les réglages doivent parvenir à l'extension et nettoyer les blocages devenus inapplicables. La protection sensible globale reste indépendante du commutateur de chaque application.

L'extension installée peut être une copie séparée du dépôt : modifier le dépôt ne recharge pas automatiquement les scripts déjà injectés dans Chrome. Ne pas annoncer un fonctionnement réel sans vérification.

## Vérifications et limites

`npm test` et la préparation de l'extension ont réussi. Le test navigateur couvre 17 pages aux largeurs 320, 390, 768 et 1440 px, dans les deux thèmes, ainsi que recherche, choix de vue persistant, menus, feedback, support, brouillons promotionnels, actualisation des routes et protection de cinq minutes. L'accueil et la connexion ont aussi été inspectés sur mobile. Captures et rapport sont dans `build/`, non envoyés sur GitHub.

La référence visuelle de sécurisation évoquée dans la demande n'était pas jointe à cette note ; le setup reprend l'intention dans la marque Control, sans prétendre reproduire une référence non disponible.

Le site hébergé n'est pas redéployé par un push GitHub. L'extension installée dans le navigateur utilisateur n'a pas été rechargée ou testée sur de vrais réseaux sociaux pendant cette reprise. Une vérification sur téléphones physiques reste distincte de l'émulation de tailles dans Chrome.
