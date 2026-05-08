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
    ├── world/                              # Composition du monde 3D persistant
    │   ├── World.tsx                       # Composition de la scène active
    │   ├── GameMap.tsx                     # Chargement de carte et collision octree
    │   ├── Lighting.tsx                    # Lumières ambiante, directionnelle et ponctuelles
    │   ├── Environment.tsx                 # Arrière-plan et modèle de ciel
    │   ├── GameMusic.tsx                   # Cycle de vie de la musique de jeu
    │   ├── debug/                          # Scène de test debug
    │   └── player/                         # Contrôleur joueur et caméra
    │
    ├── components/
    │   ├── three/                          # Composants R3F par domaine
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
- \`src/world/GameStageContent.tsx\` est enveloppé dans le contexte Rapier \`Physics\` dans la scène de jeu de production afin que les objets gameplay de stage puissent utiliser la physique sans migrer la carte ou le joueur vers Rapier.
- \`src/world/debug/TestMap.tsx\` fournit une carte orientée debug pour les interactions et la physique.
- \`src/world/player/Player.tsx\` monte la caméra et le contrôleur.
- \`src/world/player/PlayerController.tsx\` gère le mouvement pointer lock, le saut et les inputs d'interaction.

## Frontières physiques

Le projet utilise actuellement deux couches de collision avec des responsabilités séparées :

- \`GameMap\` construit une octree utilisée par le contrôleur joueur pour les collisions avec la carte.
- \`GameStageContent\` est enveloppé dans Rapier \`Physics\` pour les objets gameplay comme les triggers de réparation, les mallettes, les objets saisissables et les futurs objets spécifiques aux missions.

Le joueur et l'octree de carte doivent rester hors du provider Rapier tant qu'il n'existe pas de plan de migration volontaire. Cela évite de mélanger les règles de déplacement joueur avec la physique d'objets avant que les systèmes gameplay en aient besoin.

## Modèle d'interaction

- \`src/managers/InteractionManager.ts\` est la source d'état actuelle des interactions.
- \`src/components/three/interaction/InteractableObject.tsx\` gère la détection de focus par distance et raycasting.
- \`src/components/three/interaction/TriggerObject.tsx\` implémente les interactions de type trigger.
- \`src/components/three/interaction/GrabbableObject.tsx\` implémente les interactions saisir / relâcher.
- \`src/hooks/interaction/useInteraction.ts\` expose un snapshot d'interaction à l'UI React.
- \`src/components/ui/InteractPrompt.tsx\` affiche le prompt \`E\` pour les interactions trigger.

## Audio

- \`src/managers/AudioManager.ts\` fournit actuellement une lecture de sons one-shot avec pool.
- Les interactions trigger peuvent lancer directement un son via \`AudioManager\`.

## Système debug

- Le mode debug est activé avec \`?debug\`.
- \`src/utils/debug/Debug.ts\` possède l'instance \`lil-gui\` et les contrôles debug.
- \`src/hooks/debug/useCameraMode.ts\` et \`src/hooks/debug/useSceneMode.ts\` s'abonnent à l'état debug.
- \`src/components/debug/DebugPerf.tsx\` monte \`r3f-perf\` en lazy uniquement en mode debug.
- \`src/components/ui/debug/DebugOverlayLayout.tsx\` monte l'overlay HTML debug compact quand il est activé depuis \`lil-gui\`.
- \`src/components/ui/debug/GameStateDebugPanel.tsx\` expose l'état de jeu courant, le changement de main/sub-state, les contrôles previous/next step et le reset.
- \`src/components/ui/debug/HandTrackingDebugPanel.tsx\` affiche le statut hand tracking, l'usage, le modèle de gant chargé, le nombre de mains et l'état fist pendant l'activation du hand tracking.
- \`src/components/three/handTracking/HandTrackingGlove.tsx\` place les modèles riggés \`gant_l\` et \`gant_r\` sur les mains détectées dans la scène physics debug.
- \`src/components/debug/scene/DebugHelpers.tsx\` monte les helpers debug.
- \`src/components/debug/scene/DebugCameraControls.tsx\` monte la caméra libre debug.
- Les contrôles globaux \`lil-gui\` incluent camera mode, scene mode, \`R3F Perf\` et \`Debug Overlay\`; les contrôles d'interaction vivent dans le dossier \`Interaction\`.

## Limites actuelles

- Le dépôt est encore un prototype, pas le runtime complet du jeu.
- \`src/world/debug/TestMap.tsx\` fait encore partie de la composition active.
- Il n'existe pas encore d'orchestrateur gameplay central comme \`GameManager\`.
- Les systèmes de missions, zones, cinématiques et dialogues ne sont pas implémentés.
- Le joueur utilise une collision octree et des règles simples, pas une pile physique gameplay complète.
`;

export const targetArchitectureFr = `# Architecture cible

Ce document décrit l'architecture visée à moyen terme pour le projet.

## Relation avec le code actuel

- \`docs/technical/architecture.md\` reste la source de vérité de ce qui existe maintenant.
- Ce document décrit une direction d'architecture, pas un comportement implémenté.
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

export const zustandFr = `# État de jeu Zustand

Ce document explique comment Zustand est utilisé dans le projet actuel.

## Pourquoi Zustand existe ici

Le projet a besoin d'une source de vérité partagée pour suivre la progression du joueur dans l'expérience.

La progression actuelle est découpée en main states :

| Main state | Rôle |
| --- | --- |
| \`intro\` | Onboarding et séquence d'ouverture |
| \`bike\` | Séquence de réparation du vélo électrique |
| \`pylone\` | Séquence du réseau électrique |
| \`ferme\` | Séquence de la ferme verticale |
| \`outro\` | Séquence de fin |

Chaque main state peut aussi posséder un sous-état plus fin, comme l'étape de mission courante, l'audio de dialogue ou des flags de complétion.

Zustand est utile parce que les composants React et React Three Fiber peuvent s'abonner uniquement à la partie de state dont ils ont besoin. Quand cette partie change, seuls les composants abonnés se mettent à jour.

## Emplacement du store

Le store de progression du jeu vit ici :

\`\`\`txt
src/managers/stores/useGameStore.ts
\`\`\`

Le store est placé dans \`src/managers/stores/\` parce qu'il appartient à la couche d'orchestration gameplay, pas à un composant visuel précis.

## Managers vs Store

Les managers sont responsables des objets runtime locaux et des comportements impératifs.

Exemples :

- \`AudioManager\` possède les éléments audio et les pools de sons.
- \`InteractionManager\` possède les handles d'interaction transitoires et la logique orientée input.

Un manager peut lire ou mettre à jour le store Zustand quand son comportement local doit impacter la progression globale du jeu.

Le store Zustand est responsable de l'état global durable :

- main state courant
- sous-état de mission
- flags de progression
- références de dialogue/audio
- transitions de state

Règle simple :

- manager = objets runtime, effets de bord et logique impérative locale
- store = état gameplay global auquel l'UI ou le world peuvent s'abonner

## Forme actuelle

Le store expose :

- \`mainState\` : phase active du jeu
- \`intro\` : état spécifique à l'intro
- \`bike\` : état de la mission vélo
- \`pylone\` : état de la mission réseau électrique
- \`ferme\` : état de la mission ferme
- \`outro\` : état de fin
- des actions de mise à jour directe et des actions de progression

Les étapes de mission utilisent actuellement cette séquence :

\`\`\`ts
"locked" | "waiting" | "inspected" | "fragmented" | "scanning" | "repairing" | "done"
\`\`\`

## Lire le state dans un composant

Utilise des selectors pour lire uniquement ce dont le composant a besoin.

\`\`\`tsx
import { useGameStore } from "@/managers/stores/useGameStore";

export function Example(): React.JSX.Element {
  const mainState = useGameStore((state) => state.mainState);

  return <p>State courant : {mainState}</p>;
}
\`\`\`

C'est mieux que de lire tout le store, car le composant se re-render uniquement quand \`mainState\` change.

## Mettre à jour le state

Préfère les actions explicites du store.

\`\`\`ts
const advanceGameState = useGameStore((state) => state.advanceGameState);

advanceGameState();
\`\`\`

Pour le développement et le debug, des setters directs existent aussi :

\`\`\`ts
const setMainState = useGameStore((state) => state.setMainState);

setMainState("bike");
\`\`\`

Les setters directs sont pratiques pour les panneaux debug, mais le gameplay de production devrait préférer les actions métier comme \`advanceGameState\`, \`completeBike\` ou \`completePylone\`.

Le gameplay de mission qui peut cibler \`bike\`, \`pylone\` ou \`ferme\` doit préférer les actions génériques de mission :

\`\`\`ts
const setMissionStep = useGameStore((state) => state.setMissionStep);
const completeMission = useGameStore((state) => state.completeMission);

setMissionStep("bike", "inspected");
completeMission("bike");
\`\`\`

Cela évite aux composants gameplay réutilisables, comme les flows de réparation, de dupliquer des branches spécifiques à chaque mission avec \`setBikeState\`, \`setPyloneState\` et \`setFermeState\`.

## Intégration avec le World

\`src/world/GameStageContent.tsx\` s'abonne à \`mainState\` et monte le contenu spécifique au state courant.

La scène peut donc évoluer progressivement vers ce pattern :

\`\`\`tsx
switch (mainState) {
  case "intro":
    return <IntroContent />;
  case "bike":
    return <BikeContent />;
  case "pylone":
    return <PyloneContent />;
  case "ferme":
    return <FarmContent />;
  case "outro":
    return <OutroContent />;
}
\`\`\`

Dans React Three Fiber, monter ou démonter du JSX contrôle ce qui apparaît dans la scène Three.js. Quand un composant lié à un state disparaît du JSX, React le retire de la scène.

## Intégration UI

\`src/components/ui/GameUI.tsx\` regroupe les overlays HTML utilisés par la route jouable.

Overlays actuels :

- \`DebugOverlayLayout\` : layout compact des panels debug HTML visible avec \`?debug\`
- \`GameStateDebugPanel\` : panneau de progression debug pour consulter/changer le main state, le sub state, avancer/reculer et reset le store
- \`Crosshair\` : aide de visée joueur
- \`InteractPrompt\` : prompt d'interaction

\`src/pages/page.tsx\` doit rester fin et monter seulement le canvas et \`GameUI\`.

## Règles anti-régression

- Ne pas stocker les valeurs mises à jour à chaque frame dans Zustand.
- Utiliser \`useRef\` pour les valeurs mutables fréquentes comme la vélocité joueur, les vecteurs temporaires ou les données de boucle d'animation.
- Utiliser des selectors au lieu de lire tout le store dans les composants.
- Garder les transitions gameplay dans les actions du store quand possible.
- Garder les contrôles debug derrière \`?debug\`.
- Ajouter du state uniquement quand une vraie fonctionnalité runtime en a besoin.

## Prochaines étapes

La prochaine étape naturelle est de remplacer les ancres temporaires de \`GameStageContent\` par de vrais composants de phase, par exemple \`IntroContent\`, \`BikeContent\`, \`PyloneContent\`, \`FermeContent\` et \`OutroContent\`.
`;

export const featuresFr = `# Fonctionnalités implémentées

Ce document liste les fonctionnalités présentes dans le code actuel.

## Scène

- Scène React Three Fiber plein écran
- Carte principale chargée depuis \`public/models/{name}/model.glb\`, avec fallback vers \`model.gltf\`
- Scène de test physique debug sélectionnable depuis le panneau debug
- Contexte physique Rapier disponible pour les objets gameplay de stage en production
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
- Les objets gameplay avec physique peuvent être montés dans le contenu de stage sans remplacer la collision octree du joueur
- Prompt d'interaction affiché pour les interactions trigger

## Audio

- Lecture de sons one-shot pour les interactions trigger
- Pool simple par son via \`AudioManager\`

## Outils debug

- Le paramètre \`?debug\` active le panneau debug
- Contrôles \`lil-gui\` pour le mode caméra, le mode scène, \`R3F Perf\`, \`Debug Overlay\` et le tuning d'interaction
- Overlay debug compact pour les contrôles de game state et le statut hand tracking
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

- "name" : nom du dossier modèle dans "/public/models/{name}/model.glb", avec fallback vers "model.gltf"
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
