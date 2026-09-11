# Control

Site et extension de protection de l'attention. Les sources du site sont dans `dist/` (pas de compilation nécessaire). Le manifeste et les tests de l'extension sont dans `extension/`.

## Reprendre sur un autre ordinateur

Installer Git, Node.js 20 ou supérieur et VS Code, puis :

```sh
git clone https://github.com/Ozan-roni/Pelge.git
cd Pelge
code .
npm run dev
```

Ouvrir http://127.0.0.1:8788/#Dashboard. Aucune dépendance npm à installer pour lancer le site ou les tests de l'extension. Garder le terminal ouvert pendant l'utilisation. Si le port est déjà occupé, réutiliser le serveur existant ou l'arrêter avant d'en relancer un. Le site local n'est pas un hébergement public.

## Codex dans VS Code

Installer l'extension recommandée `openai.chatgpt`, puis exécuter **Codex: Open Codex Sidebar** depuis Ctrl+Shift+P. Effectuer la connexion dans l'interface officielle. Ne jamais copier ses identifiants ou fichiers de session dans ce dépôt.

## Tester et préparer l'extension

```sh
npm test
npm run package:extension
```

La seconde commande crée un nouveau dossier `build/extension-...` et affiche son chemin. Dans Chrome ou Edge, ouvrir la gestion des extensions, activer le mode développeur, puis charger ce dossier comme extension non empaquetée. Après une modification, préparer une nouvelle copie puis charger celle-ci, ou mettre à jour les fichiers du dossier installé et recharger l'extension. Recharger également les onglets des réseaux sociaux pour remplacer les scripts déjà injectés.

Le site seul ne filtre pas les autres sites : l'extension doit être installée dans le navigateur utilisé. Les réglages et sessions locaux ne sont pas transférés par GitHub. La synchronisation de compte/base de données n'est pas encore une garantie de ce prototype.

## Interfaces et administration locale

Les pages `#Apps`, `#Admin`, `#Contact` et `#Donation` sont accessibles directement, y compris après actualisation. Sur mobile, la barre inférieure flottante et son bouton **More** donnent accès aux pages de l'espace Control. L'accueil possède son propre sélecteur clair/sombre.

Applications propose **Grid**, **List** et **Cards** ; le choix reste enregistré sur ce navigateur. Les contrôles utilisent les règles existantes : une application activée ne se désactive qu'après **Settings → Rechoose your protection application**, avec une pause de cinq minutes. Une limite de zéro signifie **Unlimited**.

Administration est un prototype local, accessible sans autorisation serveur. **Setup your admin account** enregistre uniquement un nom et un e-mail sur ce navigateur, sans mot de passe. Le dashboard, les feedbacks, les statuts du support existant, les 200 derniers événements d'administration et les brouillons de codes promotionnels utilisent le stockage local. Les codes ne sont pas utilisables pour un paiement. Les journaux ne sont pas des traces d'audit sécurisées. Une vraie administration nécessiterait authentification, permissions et stockage contrôlés côté serveur.

Contact contient `[CONTACT_EMAIL]` et permet d'enregistrer un feedback local. Donation contient `[DONATION_LINK]` et un bouton inactif. Aucun e-mail ni paiement n'est envoyé par ces pages. Ces placeholders sont dans `dist/scripts/ControlAdmin.js`.

Les icônes sont des SVG embarqués, sans requête à un service d'icônes au chargement. Les tracés Reddit, Threads et Facebook correspondent aux ressources [Simple Icons](https://github.com/simple-icons/simple-icons/tree/develop/icons) ; les marques appartiennent à leurs propriétaires.

## Vérifier les interfaces dans un navigateur

Le test optionnel utilise Playwright dans un profil isolé. Après avoir démarré `npm run dev` dans un autre terminal :

```sh
npm ci
npx playwright install chromium
npm run test:ui
```

Il vérifie la recherche et la persistance des vues, les formulaires locaux, la reprise des routes, le support, les codes promotionnels, les menus mobiles et le maintien de la protection pendant la pause. Il contrôle 17 pages aux largeurs 320, 390, 768 et 1440 px, en clair et sombre. Les captures et le rapport JSON sont créés dans `build/ui-verification/`, ignoré par Git. Le test ne se connecte pas à une extension installée et ne simule aucun paiement ou envoi de message.

Pour utiliser Chrome déjà installé, définir `CONTROL_BROWSER_CHANNEL=chrome`. `CONTROL_TEST_URL` permet de choisir une autre adresse de serveur local (avec `/` final). `CONTROL_PLAYWRIGHT_MODULE` est facultatif pour les environnements disposant déjà de Playwright hors du projet.

## Sauvegarder son travail

Avant de commencer sur un autre ordinateur, récupérer les changements avec `git pull --ff-only` dans un dossier sans changements non sauvegardés. Après modification :

```sh
git add dist extension scripts README.md REPRISE-CONTROL.md package.json package-lock.json .gitignore .vscode
git commit -m "Describe changes"
git push
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Vérifier les fichiers avant chaque commit. Ne pas publier de mots de passe, jetons, profils de navigateur ou données personnelles. `build/` contient des copies générées et reste ignoré.

Après le push, les deux dernières commandes doivent afficher le même identifiant de commit. Si GitHub demande une connexion, la terminer dans le gestionnaire officiel Git/GitHub, relancer `git push`, puis vérifier à nouveau. Ne pas forcer le push. Sur le second appareil, `git pull --ff-only` puis `git rev-parse HEAD` permettent de confirmer la récupération du même commit.

## Hébergement

Publier le dossier `dist/` sur un hébergement statique. La configuration `.openai/hosting.json` concerne l'ancien hébergement Sites : envoyer sur GitHub ne modifie pas ses droits d'accès et ne déploie pas automatiquement le site. Un changement de domaine demande aussi de revoir les domaines autorisés dans `extension/manifest.json` et la passerelle du site.
