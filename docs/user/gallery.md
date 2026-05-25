# Galerie des modèles

La galerie est disponible sur `/gallery`. Elle permet de parcourir les modèles 3D présents dans `public/models/` sans lancer la boucle de gameplay principale.

## Objectif

Cette page sert à remercier et valoriser le travail des designers du projet La Fabrik. Chaque modèle est affiché dans un canvas dédié, avec la même skybox et le même lighting que l'expérience principale.

## Utilisation

1. Ouvrir `/gallery`.
2. Utiliser les flèches en bas de l'écran pour passer au modèle précédent ou suivant.
3. Tourner autour du modèle avec la souris ou le doigt.
4. Utiliser le bouton de réglages à droite pour ouvrir ou fermer le panneau lumière.
5. Lire le diagnostic texture discret pour savoir si le modèle chargé semble correct côté textures.

## Fonctionnement

- La liste des modèles est déclarée dans `src/data/galleryModels.ts`.
- Le viewer utilise `@react-three/fiber` et `@react-three/drei`.
- `OrbitControls` permet de manipuler la caméra autour du modèle.
- `Bounds` et `Center` recadrent automatiquement le modèle actif.
- `SkyModel` réutilise la skybox du jeu, avec un matériau non éclairé uniquement dans la galerie pour éviter que certaines faces deviennent noires avec une caméra orbitale libre.
- Les lumières reprennent les valeurs par défaut du jeu, puis peuvent être ajustées dans le panneau latéral.
- `OrbitControls` autorise une orbite verticale complète pour inspecter le dessous des modèles.
- Le viewer désactive les normal maps dans la preview pour limiter les coutures visibles sur certains exports découpés en plusieurs meshes.
- Les animations GLTF présentes dans un modèle sont lancées automatiquement.
- Un diagnostic simple inspecte les matériaux chargés pour signaler les textures absentes ou non exploitables.

## Ajouter un modèle

1. Ajouter le dossier du modèle dans `public/models/{nom}`.
2. Vérifier que le modèle possède un fichier chargeable, par exemple `model.gltf`, `model.glb` ou un nom explicite comme `potager.gltf`.
3. Ajouter une entrée dans `src/data/galleryModels.ts` avec un `id`, un `name` et un `path`.

Exemple :

```ts
{ id: "nouveau-modele", name: "Nouveau modèle", path: "/models/nouveau-modele/model.gltf" }
```

## Limites connues

- Le navigateur ne liste pas automatiquement les dossiers de `public/models/`, donc la liste reste déclarative.
- Les modèles très lourds peuvent prendre du temps à charger.
- La galerie est un viewer simple : elle ne remplace pas les outils d'inspection avancée comme Blender ou le viewer d'upload.
