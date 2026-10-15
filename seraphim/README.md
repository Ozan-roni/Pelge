# Control / Seraphim — distribution Windows et iPhone

**À partager : [télécharger le pack complet](https://github.com/Ozan-roni/Pelge/releases/latest/download/Seraphim-Partage.zip).**

[Installateur Windows seul](https://github.com/Ozan-roni/Pelge/releases/latest/download/Seraphim-Setup.exe) · [Versions publiées](https://github.com/Ozan-roni/Pelge/releases) · [Control iPhone dans Safari](https://raw.githubusercontent.com/Ozan-roni/Pelge/main/mobile/Control-iPhone.user.js)

## Installer

Sur Windows 10/11 x64, extraire le ZIP et lancer l’installateur. Il installe l’application et les fichiers d’extension dans le compte utilisateur, sans administrateur. Le guide et l’assistant expliquent comment charger **soit** le compagnon Seraphim, **soit** Control autonome dans Chrome/Edge.

Sur iPhone/iPad, Control fonctionne dans Safari via Userscripts. Le guide inclut le fichier, les liens et les QR codes. Ce paquet n’inclut pas d’application mobile native Android/iOS.

## Recevoir les modifications

- **Windows à partir de 0.16.2 :** vérification GitHub à l’ouverture, au maximum une fois par jour. La commande **Mises à jour** de l’icône près de l’horloge vérifie aussi immédiatement. Téléchargement depuis ce dépôt, contrôle de taille et SHA-256, puis confirmation avant installation et redémarrage. Le planning, le compte et les paramètres restent conservés. Les anciennes éditions nécessitent une première installation de cette version.
- **Chrome/Edge :** la mise à jour Windows remplace les fichiers des extensions dans leur dossier installé. Cliquer ensuite sur **Recharger** dans la page des extensions et recharger les onglets. Une extension chargée manuellement ne bénéficie pas du canal automatique des boutiques ; une publication en boutique est une étape distincte.
- **iPhone :** le script contient `@updateURL` et `@downloadURL` vers ce dépôt. Utiliser la commande de mise à jour de Userscripts lorsqu’elle est disponible ; sinon réinstaller depuis le même lien. Les anciennes copies sans ces métadonnées doivent être remplacées une fois. Aucun remplacement silencieux du script sur les téléphones n’est garanti.

## Publier la prochaine version

1. Modifier les sources de l’application dans `seraphim/app/source`, les ressources dans `seraphim/app/assets` et les fichiers du compagnon dans `seraphim/app/browser-extension`.
2. Pour Control autonome, modifier les fichiers dans `seraphim/app/Control-0.36.1` (le nom du dossier est conservé pour le fabricant). Pour iPhone, modifier `mobile/Control-iPhone.user.js`, augmenter `@version`, mettre à jour `mobile/Control-iPhone.meta.js`, puis recopier ces deux fichiers dans `seraphim/app/mobile`.
3. Valider les changements sur `main`. Dans **Actions → Publier Seraphim → Run workflow**, saisir un numéro Windows neuf, par exemple `0.16.3`.
4. GitHub fabrique le paquet, vérifie son inventaire, téléverse les fichiers dans une release brouillon puis la publie seulement si tout réussit. Ne pas réutiliser un numéro déjà publié. Le lien `releases/latest/download/Seraphim-Partage.zip` reste identique.

Le canal fait confiance à ce dépôt GitHub. Le SHA-256 détecte une corruption ; il ne constitue pas une signature de l’éditeur. L’installateur de cette édition n’est pas encore signé numériquement. Aucun secret, compte, planning ou historique personnel ne doit être ajouté aux sources ou ressources.

## Fabriquer localement

Sur Windows avec .NET Framework 4.8 et Python 3.12 :

```powershell
python -m pip install -r seraphim/distribution/requirements.txt
$env:SERAPHIM_VERSION='0.16.3'
python -X utf8 seraphim/distribution/build.py
python -X utf8 seraphim/distribution/prepare_release.py
```

Les fichiers apparaissent dans `seraphim/outputs/release-assets`. Le fabricant refuse d’écraser un dossier de fabrication existant. Les sources et outils de fabrication ne sont pas inclus dans l’installateur. Sources des mécanismes : [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases), [cycle de mise à jour Chrome](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle), [métadonnées Userscripts](https://github.com/quoid/userscripts#userscript-metadata).
