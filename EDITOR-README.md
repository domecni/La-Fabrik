# Editor Integration - La-Fabrik

## ✅ Intégration terminée

L'éditeur du POC-Editor a été entièrement intégré dans La-Fabrik sous la route `/editor`.

## 🎯 Fonctionnalités implémentées

### 1. **Routing React** (React Router DOM)

- Route `/` → Jeu original La-Fabrik
- Route `/editor` → Éditeur de map 3D
- Navigation fluide entre les deux

### 2. **Chargement automatique de map.json**

- Cherche `/map.json` dans `public/` au démarrage
- Scan automatique des modèles dans `public/models/`
- Fallback: interface d'upload de dossier

### 3. **Système de caméra hybride**

- Réutilise `useCameraMode()` existant de La-Fabrik
- **Mode debug** : OrbitControls (édition libre)
- **Mode player** : FPSController custom (WASD/ZQSD + souris + jump)
- Pas de dépendance à `octree` dans l'éditeur

### 4. **Visualisation 3D avancée**

- Support complet des **MapNode** (position, rotation, scale)
- Chargement de modèles GLB/GLTF depuis `models/{nom}/model.glb`
- Fallback: cubes colorés pour modèles manquants
- Highlight orange pour sélection

### 5. **Panneau de contrôle latéral**

- Transformations: Translate (T), Rotate (R), Scale (S)
- Undo/Redo avec compteurs (Ctrl+Z / Ctrl+Y)
- Export JSON des modifications
- Info sur la sélection et contrôles

### 6. **Interaction et sélection**

- Click pour sélectionner objets
- ESC pour désélectionner
- Intégration avec `InteractionManager` (système existant)
- Visual feedback avec highlighting

## 📁 Structure des fichiers

```
src/components/editor/
├── EditorPage.tsx         # Composant route /editor + CSS + upload
├── EditorViewer.tsx      # Composant principal (logique état + effets)
├── EditorCamera.tsx      # Caméra (switch OrbitControls/FPS)
├── EditorFPSController.tsx # Controller FPS sans collisions
├── MapViewer.tsx         # Visualisation map.json + modèles
├── EditorControls.tsx    # Panneau latéral UI
├── types.ts              # Types: MapNode, SceneData, TransformMode
└── EditorPage.css        # Styles scoped (~150 lignes)
```

## 🔧 Setup initial

1. **Dépendances installées** :

```bash
npm install react-router-dom --legacy-peer-deps
```

2. **Modifications apportées** :

- `main.tsx` → Enveloppé par `<BrowserRouter>`
- `App.tsx` → Routes avec `<Route path="/editor">`
- `vite.config.ts` → Pas de modif nécessaire

## 🚀 Utilisation

### Accès à l'éditeur

1. Lancer le serveur : `npm run dev`
2. Ouvrir `http://localhost:5176/editor`
3. Si `map.json` manque → uploader un dossier

### Structure du dossier

```
public/
├── map.json              # Fichier JSON avec MapNode[]
└── models/
    ├── arbre/
    │   └── model.glb     # Modèle 3D
    ├── building/
    │   └── model.glb
    └── ...
```

### Format map.json

```json
[
  {
    "name": "arbre",
    "type": "Mesh",
    "position": [0, 5, 0],
    "rotation": [0, 1.57, 0],
    "scale": [1, 1, 1]
  }
]
```

### Contrôles claviers

- **T** : Translate (déplacement)
- **R** : Rotate (rotation)
- **S** : Scale (échelle)
- **Ctrl+Z** : Undo
- **Ctrl+Y** : Redo
- **ESC** : Désélection
- **WASD/ZQSD** : Déplacement (mode player)
- **Espace** : Saut (mode player)
- **Clic souris** : Sélection objet

## 🧪 Tests recommandés

1. **Navigation** : `/` ↔ `/editor`
2. **Upload dossier** : Télécharger un dossier test
3. **Caméra** : Tester debug vs player mode
4. **Transformations** : T/R/S sur objets sélectionnés
5. **Undo/Redo** : Modifier puis annuler/rétablir
6. **Export JSON** : Exporter map.json modifié
7. **Performances** : Avec maps complexes (test map.json 12K lignes)

## 📝 Points d'attention

### Performance

- Map.json de 12K+ lignes peut impacter perfs
- Optimization: implémenter LOD si nécessaire
- Cleanup des blob URLs après upload

### Intégration systèmes existants

- Réutilise `useCameraMode()` de La-Fabrik
- Compatible avec `InteractionManager`
- Styles scoped (`editor-` prefix) pour éviter conflits

### Évolution future

- Ajouter snap/toggle grid
- Implémenter duplication objets
- Ajouter outils texturing/matériaux
- Synchronisation avec backend

## 🔗 URLs de test

- Jeu : `http://localhost:5176/`
- Éditeur : `http://localhost:5176/editor`
- Page de test : `file:///C:/Users/mathc/Documents/Programation/LA-FABRIK/La-Fabrik/test-editor.html`

---

**Statut** : ✅ Intégration complète avec toutes les fonctionnalités demandées.
**Prochaines étapes** : Tests utilisateur + optimisation performance.
