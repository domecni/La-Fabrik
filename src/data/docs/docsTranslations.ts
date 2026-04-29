export const readmeFr = `# La-Fabrik

Une expérience web 3D interactive pour La Fabrik Durable, un service low-tech de réparation et de transformation situé à Altera, une ville post-capitaliste reconstruite en 2039. Les joueurs incarnent un technicien fraîchement intégré et vivent une journée de service : réparer un vélo électrique, remettre en état un réseau d'énergie et améliorer le système d'irrigation d'une ferme verticale.

Construit avec React, Three.js et Vite. Fonctionne dans le navigateur, sans installation côté utilisateur.

## Stack technique

### Build et langage

| Package                                            |
| -------------------------------------------------- |
| [TypeScript](https://www.typescriptlang.org/docs/) |
| [React](https://react.dev/learn)                   |
| [Vite](https://vite.dev/guide/)                    |
| [ESLint](https://eslint.org/docs/latest/)          |
| [Prettier](https://prettier.io/docs/)              |

### Moteur 3D

| Package                                                                                   |
| ----------------------------------------------------------------------------------------- |
| [Three.js](https://threejs.org/docs/)                                                     |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) |
| [@react-three/drei](https://pmndrs.github.io/drei)                                        |
| [@react-three/rapier](https://rapier.rs/docs/)                                            |
| [@react-three/postprocessing](https://github.com/pmndrs/postprocessing)                   |
| [GSAP](https://gsap.com/docs/v3/Installation/)                                            |

### Performance et effets

| Package                                                                     |
| --------------------------------------------------------------------------- |
| [r3f-perf](https://github.com/utsuboco/r3f-perf)                            |
| [AnimationMixer](https://threejs.org/docs/#api/en/animation/AnimationMixer) |

## Structure du projet

\`\`\`
la-fabrik/
├── public/
│   ├── models/
│   │   ├── map/                            # Carte de base, chargée au démarrage
│   │   ├── workshop/
│   │   ├── powerGrid/
│   │   └── farm/
│   ├── textures/
│   └── sounds/
│
└── src/
    ├── world/                              # Monde 3D persistant
    │   ├── World.tsx                       # Composition principale de la scène
    │   ├── Map.tsx                         # Carte de base, toujours montée
    │   ├── Lighting.tsx                    # Lumières ambiante, directionnelle et ponctuelles
    │   ├── Environment.tsx                 # HDRI, brouillard, ciel
    │   ├── PostFX.tsx                      # Bloom, SSAO, aberration chromatique
    │   ├── zones/                          # Zones spatiales, LOD par zone
    │   └── player/                         # Contrôleur joueur et caméra
    │
    ├── components/
    │   ├── 3d/                             # Éléments 3D réutilisables
    │   └── ui/                             # Overlays HTML hors Canvas
    │
    ├── managers/                           # Logique, état et orchestration
    ├── hooks/                              # Hooks React autour des managers
    ├── data/                               # Configuration statique
    ├── shaders/                            # Shaders GLSL
    └── utils/                              # Utilitaires partagés et debug
\`\`\`

## Démarrage

\`\`\`bash
git clone https://github.com/La-Fabrik-Durable/La-Fabrik.git
cd La-Fabrik
npm install
npm run dev
\`\`\`

- application : \`http://localhost:5173\`
- mode debug : \`http://localhost:5173?debug\`

## Licence

Voir le fichier [LICENSE](./LICENSE).
`;

export const architectureFr = `# Architecture actuelle

Ce document décrit le code réellement présent aujourd'hui dans le dépôt.

## Structure runtime

- \`src/App.tsx\` monte le \`RouterProvider\`, qui pilote l'affichage des vues de l'application.
- \`src/pages/page.tsx\` monte le \`Canvas\`, le \`World\` 3D, l'overlay de performance debug et les overlays HTML.
- \`src/world/World.tsx\` compose la scène active avec :
  - l'environnement et l'éclairage
  - les helpers debug et le mode caméra debug
  - soit la carte principale, soit la scène de test physique debug
  - le rig joueur quand le mode caméra actif est \`player\`
- \`src/world/GameMap.tsx\` charge les modèles de carte disponibles et construit l'octree de collision.
- \`src/world/debug/TestScene.tsx\` fournit une scène orientée debug pour les interactions et la physique.
- \`src/world/player/Player.tsx\` monte la caméra et le contrôleur.
- \`src/world/player/PlayerController.tsx\` gère le mouvement pointer lock, le saut et les inputs d'interaction.

## Modèle d'interaction

- \`src/managers/InteractionManager.ts\` est la source d'état actuelle des interactions.
- \`src/components/three/InteractableObject.tsx\` gère la détection de focus par distance et raycasting.
- \`src/components/three/TriggerObject.tsx\` implémente les interactions de type trigger.
- \`src/components/three/GrabbableObject.tsx\` implémente les interactions saisir / relâcher.
- \`src/hooks/useInteraction.ts\` expose un snapshot d'interaction à l'UI React.
- \`src/components/ui/InteractPrompt.tsx\` affiche le prompt \`E\` pour les interactions trigger.

## Audio

- \`src/managers/AudioManager.ts\` fournit actuellement une lecture de sons one-shot avec pool.
- Les interactions trigger peuvent lancer directement un son via \`AudioManager\`.

## Système debug

- Le mode debug est activé avec \`?debug\`.
- \`src/utils/debug/Debug.ts\` possède l'instance \`lil-gui\` et les contrôles debug.
- \`src/hooks/debug/useCameraMode.ts\` et \`src/hooks/debug/useSceneMode.ts\` s'abonnent à l'état debug.
- \`src/components/debug/DebugPerf.tsx\` monte \`r3f-perf\` en lazy uniquement en mode debug.
- \`src/components/debug/scene/DebugHelpers.tsx\` monte les helpers debug.
- \`src/components/debug/scene/DebugCameraControls.tsx\` monte la caméra libre debug.

## Limites actuelles

- Le dépôt est encore un prototype, pas le runtime complet du jeu.
- \`src/world/debug/TestScene.tsx\` fait encore partie de la composition active.
- Il n'existe pas encore d'orchestrateur gameplay central comme \`GameManager\`.
- Les systèmes de missions, zones, cinématiques et dialogues ne sont pas implémentés.
- Le joueur utilise une collision octree et des règles simples, pas une pile physique gameplay complète.
`;

export const targetArchitectureFr = `# Architecture cible

Ce document décrit l'architecture visée à moyen terme pour le projet.

## Relation avec le code actuel

- \`docs/technical/architecture.md\` reste la source de vérité de ce qui existe maintenant.
- Ce document est volontairement aspirational.
- Si ce document contredit l'implémentation actuelle, l'implémentation actuelle gagne.

## Objectifs

- Garder \`App.tsx\` petit et centré sur l'orchestration.
- Séparer le code de production du monde des chemins runtime uniquement debug.
- Garder une source de vérité claire par responsabilité.
- Faire grandir les systèmes gameplay progressivement, sans préconstruire une architecture vide.

## Couches prévues

### Couche App

- \`App.tsx\` monte la scène canvas et les overlays HTML de premier niveau.
- Il doit rester fin et éviter la logique gameplay.

### Couche World

- \`src/world/\` doit contenir la composition de scène de production et les objets de scène de production.
- Responsabilités attendues :
  - composition du monde
  - carte, environnement, éclairage
  - contrôleur joueur
  - ancres d'interaction de production
  - post-processing de production si nécessaire

### Couche Debug

- Les scènes et outils uniquement debug doivent être isolés du chemin de production.
- Responsabilités attendues :
  - \`lil-gui\`
  - overlay de performance
  - helpers de scène
  - caméra libre et contrôles de calibration
  - scènes temporaires de test utilisées pendant le développement

### Couche UI

- \`src/components/ui/\` doit contenir les overlays HTML visibles par le joueur.
- Exemples futurs :
  - crosshair
  - flow de chargement
  - HUD de mission
  - overlays narratifs

### Couche Gameplay

- À mesure que le projet grandit, l'état gameplay peut évoluer vers une couche d'orchestration plus claire.
- Sujets probables :
  - missions
  - zones
  - cinématiques
  - dialogues
  - audio
  - interactions

## Règles

- Préférer du code direct et fonctionnel plutôt qu'un échafaudage spéculatif.
- Les types partagés doivent rester proches de leur domaine jusqu'à avoir plusieurs vrais consommateurs.
- Éviter de créer de nouveaux managers ou services sans besoin runtime actif.
- Les chemins runtime uniquement debug doivent être clairement marqués et faciles à retirer plus tard.
`;

export const featuresFr = `# Fonctionnalités implémentées

Ce document liste les fonctionnalités présentes dans le code actuel.

## Scène

- Scène React Three Fiber plein écran
- Carte principale chargée depuis \`public/models/map/model.gltf\`
- Scène de test physique debug sélectionnable depuis le panneau debug
- Éclairage ambiant et directionnel
- Configuration de l'environnement de fond

## Joueur

- Mode caméra joueur
- Orientation souris avec pointer lock
- Déplacement avec \`ZQSD\`
- Saut
- Collision basée sur une octree contre la carte chargée

## Interactions

- Détection de focus par distance et raycast
- Interactions trigger activées avec \`E\`
- Interactions grab activées avec le bouton principal de la souris
- Prompt d'interaction affiché pour les interactions trigger

## Audio

- Lecture de sons one-shot pour les interactions trigger
- Pool simple par son via \`AudioManager\`

## Outils debug

- Le paramètre \`?debug\` active le panneau debug
- Contrôles \`lil-gui\` pour le mode caméra, le mode scène et les sphères d'interaction
- Helpers de scène debug
- Caméra libre debug
- Overlay \`r3f-perf\`

## Pas encore implémenté

- système de missions
- système de zones
- système de cinématiques
- système de dialogues
- flow de chargement
- minimap et HUD de mission
- séparation complète production / debug pour les scènes gameplay
`;

export const editorFr = `# Éditeur de carte

L'éditeur de carte est disponible sur "/editor". Il permet d'inspecter et d'ajuster les objets déclarés dans "/public/map.json" directement depuis le navigateur.

## Ce qui est édité

L'éditeur travaille sur la liste de nodes stockée dans "/public/map.json".

Chaque node décrit un objet de la scène :

- "name" : nom du dossier modèle dans "/public/models/{name}/model.gltf"
- "type" : catégorie de l'objet
- "position" : "[x, y, z]"
- "rotation" : "[x, y, z]"
- "scale" : "[x, y, z]"

Les modèles sont chargés depuis "/public/models". Si un modèle manque, l'éditeur affiche un cube gris de remplacement pour que le node reste sélectionnable et déplaçable.

## Workflow de base

1. Ouvrir "/editor".
2. Sélectionner un objet dans la vue 3D.
3. Choisir un mode de transformation : translation, rotation ou scale.
4. Déplacer la gizmo de transformation.
5. Utiliser undo ou redo si nécessaire.
6. Exporter le JSON mis à jour ou le sauvegarder sur le serveur de dev.

## Contrôles

| Action | Input |
| --- | --- |
| Sélectionner un objet | Clic sur l'objet |
| Désélectionner | "Esc" ou clic dans le vide |
| Mode translation | "T" |
| Mode rotation | "R" |
| Mode scale | "S" |
| Undo | "Ctrl+Z" |
| Redo | "Ctrl+Y" |
| Déplacement en vue verrouillée | "WASD", "ZQSD", flèches |
| Monter / descendre | "Space", "Shift" |

## Actions fichier

### Export JSON

"Export JSON" télécharge la liste actuelle des nodes sous le nom "map.json". À utiliser pour remplacer manuellement "/public/map.json".

### Save to server

"Save to server" est disponible uniquement en développement local. L'action écrit la carte modifiée dans "/public/map.json" via l'endpoint du serveur de dev Vite.

Cette action est masquée dans les builds de production car il n'existe pas encore d'API de persistance production.

## Inspecteur JSON

Le panneau latéral affiche le JSON brut de la carte :

- sans sélection, il affiche toute la liste des nodes
- avec un objet sélectionné, il met en évidence les lignes du node sélectionné

Utilise-le pour vérifier les valeurs numériques exactes avant export ou sauvegarde.

## Limites actuelles

- L'éditeur modifie uniquement les nodes existants.
- Il n'y a pas encore d'interface pour créer ou supprimer des objets.
- La sauvegarde production n'est pas implémentée.
- Les modèles manquants s'affichent comme cubes de fallback au lieu de bloquer tout l'éditeur.
`;
