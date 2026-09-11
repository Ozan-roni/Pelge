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

Ouvrir http://127.0.0.1:8788/#Dashboard. Aucune dépendance npm à installer. Garder le terminal ouvert pendant l'utilisation. Si le port est déjà occupé, arrêter l'ancien serveur. Le site local n'est pas un hébergement public.

## Codex dans VS Code

Installer l'extension recommandée `openai.chatgpt`, puis exécuter **Codex: Open Codex Sidebar** depuis Ctrl+Shift+P. Effectuer la connexion dans l'interface officielle. Ne jamais copier ses identifiants ou fichiers de session dans ce dépôt.

## Tester et préparer l'extension

```sh
npm test
npm run package:extension
```

La seconde commande crée un nouveau dossier `build/extension-...` et affiche son chemin. Dans Chrome ou Edge, ouvrir la gestion des extensions, activer le mode développeur, puis charger ce dossier comme extension non empaquetée. Après une modification, préparer une nouvelle copie puis charger celle-ci, ou mettre à jour les fichiers du dossier installé et recharger l'extension. Recharger également les onglets des réseaux sociaux pour remplacer les scripts déjà injectés.

Le site seul ne filtre pas les autres sites : l'extension doit être installée dans le navigateur utilisé. Les réglages et sessions locaux ne sont pas transférés par GitHub. La synchronisation de compte/base de données n'est pas encore une garantie de ce prototype.

## Sauvegarder son travail

Avant de commencer sur un autre ordinateur, récupérer les changements avec `git pull --ff-only` dans un dossier sans changements non sauvegardés. Après modification :

```sh
git add dist extension scripts README.md package.json .gitignore .vscode
git commit -m "Describe changes"
git push
```

Vérifier les fichiers avant chaque commit. Ne pas publier de mots de passe, jetons, profils de navigateur ou données personnelles. `build/` contient des copies générées et reste ignoré.

## Hébergement

Publier le dossier `dist/` sur un hébergement statique. La configuration `.openai/hosting.json` concerne l'ancien hébergement Sites : envoyer sur GitHub ne modifie pas ses droits d'accès et ne déploie pas automatiquement le site. Un changement de domaine demande aussi de revoir les domaines autorisés dans `extension/manifest.json` et la passerelle du site.
