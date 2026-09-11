# Mise à jour Control 0.33.0

La mise à jour du site ne remplace pas les fichiers de l’extension déjà installée.

1. Décompresser le nouveau paquet dans un dossier permanent.
2. Dans Chrome ou Edge, ouvrir la page Extensions et activer le mode développeur si nécessaire.
3. Pour une extension décompressée existante, remplacer ses fichiers par ceux du paquet puis cliquer sur Recharger. Ne pas désinstaller l’extension : cela peut effacer ses données locales.
4. Actualiser une fois les onglets Control et les réseaux sociaux déjà ouverts. Les anciens scripts peuvent avoir supprimé des éléments ; ce premier rechargement restaure leur page native.
5. Le site doit afficher « Extension connected ». « Saved locally » signifie que les choix ne sont pas transmis à l’extension dans ce navigateur.

Après la mise à jour, désactiver une application retire les effets de Control, le minuteur et les blocages de limite/global sur cette application. Les réglages sont conservés pour une réactivation. Une limite de zéro signifie illimité.

Vérifications locales : node extension/check.cjs et node extension/check-settings.cjs.
Les tests simulés ne remplacent pas une vérification sur un compte connecté au réseau social.
