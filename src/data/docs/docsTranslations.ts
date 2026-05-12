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
- \`src/world/GameStageContent.tsx\` est enveloppé dans le contexte Rapier \`Physics\` dans la scène de jeu de production afin que les objets gameplay de stage puissent utiliser la physique sans migrer la carte ou le joueur vers Rapier. Il monte maintenant des instances réutilisables de \`RepairGame\` pour les états de mission \`bike\`, \`pylone\` et \`ferme\`.
- \`src/world/debug/TestMap.tsx\` fournit une carte orientée debug pour les interactions et la physique, avec les objets existants de grab, trigger et preview de modèle, plus des zones playground de réparation séparées \`Bike\`, \`Pylone\` et \`Farm\`.
- \`src/world/player/Player.tsx\` monte la caméra et le contrôleur.
- \`src/world/player/PlayerController.tsx\` gère le mouvement pointer lock, le saut, le verrouillage de déplacement pendant les étapes repair et les inputs d'interaction.

## Frontières physiques

Le projet utilise actuellement deux couches de collision avec des responsabilités séparées :

- \`GameMap\` construit une octree utilisée par le contrôleur joueur pour les collisions avec la carte.
- \`GameStageContent\` est enveloppé dans Rapier \`Physics\` pour les objets gameplay comme les triggers de réparation, les mallettes, les objets saisissables et les futurs objets spécifiques aux missions.
- \`TestMap\` possède son propre playground Rapier \`Physics\` afin de peaufiner le gameplay de réparation par state de mission sans dépendre du placement de la carte de production.

Le joueur et l'octree de carte doivent rester hors du provider Rapier tant qu'il n'existe pas de plan de migration volontaire. Cela évite de mélanger les règles de déplacement joueur avec la physique d'objets avant que les systèmes gameplay en aient besoin.

## Modèle d'interaction

- \`src/managers/InteractionManager.ts\` est la source d'état actuelle des interactions.
- \`src/components/three/interaction/InteractableObject.tsx\` gère la détection de focus par distance et raycasting.
- \`src/components/three/interaction/TriggerObject.tsx\` implémente les interactions de type trigger.
- \`src/components/three/interaction/GrabbableObject.tsx\` implémente les interactions saisir / relâcher.
- \`src/hooks/interaction/useInteraction.ts\` expose un snapshot d'interaction à l'UI React.
- \`src/components/ui/InteractPrompt.tsx\` affiche le prompt \`E\` pour les interactions trigger.

## Audio

- \`src/managers/AudioManager.ts\` fournit la lecture de sons one-shot avec pool, la musique en boucle, les volumes par catégorie et un pan stéréo optionnel pour les sons one-shot.
- Les catégories audio supportées sont \`music\`, \`sfx\` et \`dialogue\`.
- Les interactions trigger peuvent lancer directement des SFX via \`AudioManager\`.

## Menu options

- \`src/managers/stores/useSettingsStore.ts\` stocke les réglages de volume musique, volume SFX, volume dialogue, sous-titres, langue des sous-titres, runtime de réparation et visibilité du menu.
- \`src/components/ui/GameSettingsMenu.tsx\` rend le menu options en jeu.
- \`src/components/ui/GameUI.tsx\` monte le menu comme overlay HTML hors canvas.
- \`Esc\` ouvre et ferme le menu, et \`src/world/player/PlayerController.tsx\` ignore les inputs joueur pendant son ouverture.
- Les changements de volume sont transmis à \`AudioManager\` par catégorie.

## Dialogues et sous-titres

- \`public/sounds/dialogue/dialogues.json\` est le manifeste runtime des dialogues.
- Les fichiers audio de dialogue vivent dans \`public/sounds/dialogue/\`.
- Les fichiers de sous-titres vivent dans \`public/sounds/dialogue/subtitles/{fr|en}/\`.
- Le modèle actuel utilise un fichier SRT par voix et par langue.
- \`src/types/dialogues/dialogues.ts\` contient les types du manifeste.
- \`src/utils/dialogues/dialogueManifestValidation.ts\` valide la forme du manifeste au runtime.
- \`src/utils/dialogues/loadDialogueManifest.ts\` charge le manifeste et les cues SRT, avec fallback français si la langue sélectionnée manque.
- \`src/utils/subtitles/parseSrt.ts\` parse les blocs et timecodes SRT.
- \`src/utils/dialogues/playDialogue.ts\` joue l'audio de dialogue et synchronise le sous-titre actif avec le temps de l'élément audio.
- \`src/managers/stores/useSubtitleStore.ts\` stocke la cue de sous-titre affichée.
- \`src/components/ui/Subtitles.tsx\` rend l'overlay de sous-titres.
- \`src/world/GameDialogues.tsx\` déclenche actuellement les dialogues qui définissent un \`timecode\`.
- La lecture de dialogue est mise en file pour éviter les chevauchements.

## Cinématiques

- \`public/cinematics.json\` est le manifeste runtime des cinématiques.
- \`src/types/cinematics/cinematics.ts\` contient les types du manifeste.
- \`src/utils/cinematics/cinematicManifestValidation.ts\` valide la forme du manifeste.
- \`src/utils/cinematics/loadCinematicManifest.ts\` charge \`/cinematics.json\`.
- \`src/world/GameCinematics.tsx\` déclenche les cinématiques qui définissent un \`timecode\` global.
- Les cinématiques utilisent GSAP pour animer la position caméra et sa cible de regard.
- Les \`dialogueCues\` d'une cinématique déclenchent des dialogues à des temps relatifs au début de la cinématique.
- \`useGameStore.isCinematicPlaying\` sert à bloquer les inputs joueur pendant une cinématique.

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

## Domaines de composants 3D

- \`src/components/three/models/\` contient les helpers de modèles réutilisables comme \`ExplodableModel\`.
- \`src/components/three/interaction/\` contient les wrappers d'interaction réutilisables comme \`InteractableObject\`, \`TriggerObject\` et \`GrabbableObject\`.
- \`src/components/three/handTracking/\` contient les modèles debug R3F liés au hand tracking, comme les gants.
- \`src/components/three/gameplay/\` contient les composants de gameplay de réparation : le flow de production réutilisable \`RepairGame\`, la mallette, les étapes de réparation et les prompts.
- \`src/components/three/world/\` contient les objets world/environnement réutilisables comme \`SkyModel\`.

## Limites actuelles

- Le dépôt est encore un prototype, pas le runtime complet du jeu.
- \`src/world/debug/TestMap.tsx\` fait encore partie de la composition active.
- Il n'existe pas encore d'orchestrateur gameplay central comme \`GameManager\`.
- L'état de mission existe dans Zustand et le flow de réparation est implémenté comme prototype pour les missions de réparation actuelles.
- Les cinématiques et dialogues existent comme systèmes prototype pilotés par timecode; les branches de dialogue et l'orchestration gameplay globale restent limitées.
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
"locked" | "waiting" | "inspected" | "fragmented" | "scanning" | "repairing" | "reassembling" | "done"
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

Pour les missions de réparation, il monte le composant réutilisable \`RepairGame\` avec un id de mission :

\`\`\`tsx
<RepairGame mission="bike" position={[8, 0, -6]} />
\`\`\`

\`RepairGame\` lit l'étape de mission active depuis le store et écrit les transitions via des actions génériques comme \`setMissionStep\` et \`completeMission\`. Les ids de mission, étapes de mission et guards partagés vivent dans \`src/types/gameplay/repairMission.ts\`, ce qui évite à la configuration statique des missions de dépendre du store Zustand. Le flow de réparation de production supporte actuellement les transitions \`waiting -> inspected -> fragmented -> scanning -> repairing -> reassembling -> done -> next mission\`.

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
- \`RepairMovementLockIndicator\` : indicateur joueur affiché quand les étapes repair désactivent temporairement le déplacement

\`src/pages/page.tsx\` doit rester fin et monter seulement le canvas et \`GameUI\`.

## Règles anti-régression

- Ne pas stocker les valeurs mises à jour à chaque frame dans Zustand.
- Utiliser \`useRef\` pour les valeurs mutables fréquentes comme la vélocité joueur, les vecteurs temporaires ou les données de boucle d'animation.
- Utiliser des selectors au lieu de lire tout le store dans les composants.
- Garder les transitions gameplay dans les actions du store quand possible.
- Garder les contrôles debug derrière \`?debug\`.
- Ajouter du state uniquement quand une vraie fonctionnalité runtime en a besoin.

## Prochaines étapes

Déplacer la validation de réparation dans les données de mission lorsque chaque mission aura ses propres nodes de modules cassés, assets de remplacement et événements de complétion.
`;

export const featuresFr = `# Fonctionnalités implémentées

Ce document liste les fonctionnalités présentes dans le code actuel.

## Scène

- Scène React Three Fiber plein écran
- Carte principale chargée depuis \`public/models/{name}/model.glb\`, avec fallback vers \`model.gltf\`
- Scène de test physique debug sélectionnable depuis le panneau debug, avec tests grab/trigger, preview de modèle animé et zones playground de réparation séparées pour \`bike\`, \`pylone\` et \`ferme\`
- Contexte physique Rapier disponible pour les objets gameplay de stage en production
- Éclairage ambiant et directionnel
- Configuration de l'environnement de fond

## Joueur

- Mode caméra joueur
- Orientation souris avec pointer lock
- Déplacement avec \`ZQSD\`
- Saut
- Verrouillage du déplacement pendant les étapes repair actives, avec indicateur à l'écran tout en gardant les interactions trigger disponibles
- Collision basée sur une octree contre la carte chargée

## Interactions

- Détection de focus par distance et raycast
- Interactions trigger activées avec \`E\`
- Interactions grab activées avec le bouton principal de la souris
- Les objets gameplay avec physique peuvent être montés dans le contenu de stage sans remplacer la collision octree du joueur
- Prompt d'interaction affiché pour les interactions trigger

## Gameplay de réparation

- \`RepairGame\` de production réutilisable monté pour les états de mission \`bike\`, \`pylone\` et \`ferme\`
- Le playground physics debug monte le même \`RepairGame\` réutilisable dans des zones \`Bike\`, \`Pylone\` et \`Farm\`, afin de peaufiner chaque state avec un placement isolé avant déplacement vers la carte de production
- Configuration de mission partagée via \`src/data/gameplay/repairMissions.ts\`, avec nodes cassés, placeholders cibles, timing de scan et timing de réassemblage propres à chaque mission
- Flow repair-game avec \`waiting -> inspected -> fragmented -> scanning -> repairing -> reassembling -> done -> next mission\`, prompts \`.webm\`, apparition/ouverture/sortie de la mallette, vue focalisée de la mallette, indicateur de verrouillage de déplacement pendant la réparation active, interaction trigger sur la mallette, traverse des placeholders de mallette, placement avec snap vers placeholder, feedback de dépôt des pièces cassées, touche \`E\`, hold deux poings, transition de modèle explosé, réassemblage inverse avec particules, scan visuel par pièce, marqueur rouge persistant et vidéo UI centrée sur les pièces cassées, plusieurs choix de pièces grabbables, feedback de validation de la bonne pièce et complétion de mission

## Audio

- Volumes par catégorie pour la musique, les SFX et les dialogues
- Lecture de musique en boucle via \`AudioManager\`
- Lecture de sons one-shot pour les SFX et les dialogues, avec pool simple par son
- Pan stéréo optionnel pour les sons one-shot

## Dialogues et sous-titres

- Manifeste de dialogues dans \`public/sounds/dialogue/dialogues.json\`
- Audios de dialogue chargés depuis \`public/sounds/dialogue/\`
- Un fichier SRT par voix et par langue
- Fallback vers les sous-titres français quand le fichier de langue sélectionné manque
- Overlay de sous-titres runtime avec couleurs par speaker
- Déclenchement timecodé pour les dialogues qui définissent \`timecode\`
- File d'attente pour éviter les dialogues superposés

## Cinématiques

- Manifeste de cinématiques dans \`public/cinematics.json\`
- Déclenchement timecodé des cinématiques
- Lecture de keyframes caméra via GSAP
- Dialogue cues optionnelles synchronisées avec les timelines de cinématique
- Blocage des inputs joueur pendant une cinématique

## Menu options

- \`Esc\` ouvre et ferme le menu options en jeu
- Sliders de volume musique, SFX et dialogue
- Toggle d'affichage des sous-titres
- Choix de langue des sous-titres entre français et anglais
- Choix du runtime de réparation entre JavaScript local et serveur Python
- Action quitter qui nettoie les cookies accessibles au navigateur et retourne vers \`/\`

## Outils debug

- Le paramètre \`?debug\` active le panneau debug
- Contrôles \`lil-gui\` pour le mode caméra, le mode scène, \`R3F Perf\`, \`Debug Overlay\` et le tuning d'interaction
- Overlay debug compact pour les contrôles de game state et le statut hand tracking
- Le changement de mission dans le panneau game-state debug déverrouille les missions repair encore \`locked\` à \`waiting\` pour accélérer les tests
- Helpers de scène debug
- Caméra libre debug
- Overlay \`r3f-perf\`

## Éditeur de carte

- Route \`/editor\` pour inspecter et éditer \`public/map.json\`
- Chargement automatique de \`public/map.json\` quand il existe
- Rendu des modèles disponibles depuis \`public/models/{name}/model.glb\` ou \`model.gltf\`
- Cubes de fallback pour les nodes dont le modèle manque
- Sélection d'objet au clic
- Modes de transformation translation, rotation et scale
- Export JSON pour télécharger la carte modifiée
- Endpoint de sauvegarde dev-server pour écrire \`public/map.json\`
- Éditeur SRT pour les sous-titres de dialogue
- Preview audio et outils de timing pour les cues SRT
- Endpoint de sauvegarde dev-server pour les fichiers SRT
- Validation du manifeste de dialogues depuis l'UI de l'éditeur
- Éditeur de manifeste dialogues avec preview et création assistée de cue SRT FR
- Éditeur de manifeste cinématiques avec keyframes caméra, dialogue cues et preview canvas

## Pas encore implémenté

- système de missions complet
- système de zones
- branches de dialogues gameplay au-delà des déclencheurs prototype actuels
- flow de chargement
- minimap et HUD de mission
- séparation complète production / debug pour les scènes gameplay
`;

export const editorFr = `# Guide utilisateur de l'éditeur

L'éditeur est disponible sur \`/editor\`. Il sert à modifier la carte runtime, les cinématiques, le manifeste de dialogues et les sous-titres SRT sans éditer tous les fichiers à la main.

## À quoi il sert

Utilise l'éditeur pour :

- déplacer, tourner ou scaler les objets de \`public/map.json\`
- inspecter le JSON généré avant export ou sauvegarde
- prévisualiser et modifier \`public/cinematics.json\`
- créer, prévisualiser et valider les dialogues de \`public/sounds/dialogue/dialogues.json\`
- modifier les fichiers SRT FR/EN par voix

## Organisation du panneau

Le panneau latéral est divisé en groupes repliables :

- \`Editor\` : transforms, raccourcis, sélection, vue, JSON et actions fichier.
- \`Cinematics\` : cinématiques et keyframes caméra.
- \`Dialogues\` : manifeste des dialogues.
- \`SRT\` : fichiers de sous-titres par voix et langue.

## Carte et transforms

1. Ouvre \`/editor\`.
2. Clique un objet pour le sélectionner.
3. Choisis \`Translate\`, \`Rotate\` ou \`Scale\`.
4. Déplace la gizmo dans la vue 3D.
5. Vérifie le bloc \`JSON\` si tu veux contrôler les valeurs exactes.
6. Utilise \`Undo\` ou \`Redo\` si besoin.
7. Utilise \`Export JSON\` ou \`Save to server\`.

Contrôles utiles :

| Action | Input |
| --- | --- |
| Sélectionner | Clic objet |
| Désélectionner | \`Esc\` ou clic vide |
| Verrouiller la sélection | bouton lock |
| Vider la sélection | bouton \`X\` |
| Translate | \`T\` |
| Rotate | \`R\` |
| Scale | \`S\` |
| Undo / redo | \`Ctrl+Z\` / \`Ctrl+Y\` |
| Déplacement vue verrouillée | \`WASD\`, \`ZQSD\`, flèches |

Quand la sélection est verrouillée, cliquer un autre objet, cliquer dans le vide ou appuyer sur \`Esc\` ne change pas la sélection. Le bouton \`X\` reste le moyen volontaire de la vider.

## Inspecteur JSON

Le bloc \`JSON\` affiche le JSON qui sera exporté ou sauvegardé :

- sans sélection, il affiche toute la liste de nodes
- avec une sélection, il affiche les lignes du node sélectionné

Cet inspecteur est en lecture seule. Les valeurs changent via la gizmo de transformation.

## Sauvegarde

- \`Export JSON\` télécharge un \`map.json\` local.
- \`Save to server\` écrit directement \`public/map.json\` via le serveur Vite local.

Les sauvegardes serveur sont des helpers de développement, pas des APIs de production.

## Cinématiques

Le groupe \`Cinematics\` édite \`public/cinematics.json\`.

Une cinématique contient :

- un \`id\`
- un \`timecode\` global optionnel
- au moins deux keyframes caméra
- des \`dialogueCues\` optionnelles

Workflow conseillé :

1. Sélectionne une cinématique ou clique \`Add\`.
2. Donne un \`id\` stable.
3. Ajoute ou ajuste les keyframes caméra.
4. Garde les temps de keyframes dans l'ordre croissant.
5. Ajoute des \`dialogueCues\` si un dialogue doit démarrer pendant la cinématique.
6. Clique \`Preview cinematic\` pour tester la caméra.
7. Clique \`Save\`.

Les temps de keyframes et de dialogue cues sont relatifs au début de la cinématique.

## Dialogues

Le groupe \`Dialogues\` édite \`public/sounds/dialogue/dialogues.json\`.

Chaque dialogue contient :

- \`id\` : identifiant stable utilisé par les cinématiques et le runtime
- \`voice\` : \`narrateur\`, \`fermier\` ou \`electricienne\`
- \`audio\` : chemin MP3 runtime
- \`subtitleCueIndex\` : numéro de cue dans le SRT de la voix
- \`timecode\` : déclenchement global optionnel

Workflow conseillé pour créer un dialogue :

1. Clique \`Add\`.
2. Choisis la bonne voix.
3. Remplace l'\`id\` généré par un ID lisible.
4. Remplace le chemin audio placeholder par le vrai MP3.
5. Vérifie le \`subtitleCueIndex\`.
6. Clique \`Create FR SRT cue\` si la cue manque.
7. Clique \`Save\`.
8. Passe dans \`SRT\` pour écrire le texte et régler les timings.
9. Lance \`Validate\`.

## SRT

Le groupe \`SRT\` édite un fichier de sous-titres à la fois.

1. Choisis une voix.
2. Choisis \`FR\` ou \`EN\`.
3. Écris le texte SRT.
4. Prévisualise l'audio.
5. Utilise \`Set start\`, \`Set end\`, \`-100ms\` et \`+100ms\` pour ajuster les timings.
6. Clique \`Save SRT\` ou \`Export SRT\`.

Il y a un fichier SRT par voix et par langue, pas un fichier par dialogue. Les timings SRT sont relatifs au fichier audio du dialogue.

## Validation

\`Validate\` vérifie :

- le manifeste \`dialogues.json\`
- les fichiers audio référencés
- les fichiers SRT français
- les indexes de cues référencés
- les SRT anglais en warning si manquants

## Limites actuelles

- L'éditeur modifie les nodes existants mais ne crée pas encore d'objet de carte.
- Les sauvegardes serveur sont limitées au développement local.
- L'éditeur SRT reste textuel, sans waveform.
- Les modèles manquants sont représentés par des cubes de fallback.
`;
