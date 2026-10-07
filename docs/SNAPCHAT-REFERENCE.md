# Snapchat mobile : comparaison des captures et contrat de présentation

Référence utilisateur : capture de l'application Snapchat native, 1170×2532 pixels. Capture défectueuse : Safari avec Control, même résolution. Mesures ramenées à une largeur de 390 pixels CSS ; les barres iOS/Safari ne font pas partie de la page web.

| Élément | Capture Control | Référence et correction attendue |
| --- | --- | --- |
| En-tête | Bouton Control superposé, compte/réglages sur une ligne séparée | Chat centré ; recherche à gauche ; réglages à droite dans le même en-tête |
| Navigation | Catégorie Chat restante en bas | Aucune catégorie, navigation basse, Story, caméra de liste ou bouton de composition |
| Lignes | Avatars ~62 px, noms gras, texte à ~86 px du bord | Avatars 48 px, texte à 67 px, hauteur de ligne 66 px, nom 19 px et statut 13 px |
| Statut | Voir chevauche le nom/statut ; SVG reçu coupé | Une icône de 14 px à gauche, un texte en une ligne à droite ; action native accessible sans chevauchement |
| Bitmoji | Bulles et silhouettes parasites, portraits trop petits | Portrait natif remplissant le cercle gris ; emoji amical au-dessus, sans découpe |
| Groupe | Superposition incohérente | Trois membres maximum : un grand au centre, deux plus petits derrière et atténués ; conserver un asset composite natif lorsqu'il existe |
| Snaps | Appui sans ouverture, média caché par le panneau | Conserver le gestionnaire natif, le hit-test et le geste utilisateur ; lecteur immédiatement au-dessus de la conversation |
| Réglages | Carte vitrée inventée, éléments trop grands | Panneau sobre blanc/gris, typographie système, lignes et séparateurs réguliers, actions natives conservées |
| Caméra | Portrait imposé/zoom | Ratio réel du flux, aucune résolution/contrainte imposée, ni rotation ou recadrage ajouté |
| Navigation chat | Découpe et transitions instables | En-tête et saisie fixes ; historique défilant ; fondu court ; retour conservant la position de liste |

Source des états d'icônes : [Snapchat Support](https://help.snapchat.com/hc/fr-fr/articles/7012315702548-Que-signifient-les-ic%C3%B4nes-affich%C3%A9es-sur-l-%C3%A9cran-du-Chat). Bleu : chat ; rouge : Snap sans son ; violet : Snap avec son. Remplissage/contour suivent le statut natif. Aucun état n'est inventé lorsqu'il manque des informations.

La prévisualisation doit être produite en exécutant le script réellement livré, avec la largeur 390 px, des portraits provenant de la référence pour la fixture locale, et un DOM reproduisant les défauts de la première capture. Vérifier aussi 320/430 px, le recyclage des lignes, la liste longue, les menus natifs, l'appui sur un Snap, un lecteur imbriqué et le retour. Les captures sont des simulations de la page web et ne valident pas un compte Snapchat ou Safari sur iPhone physique.
