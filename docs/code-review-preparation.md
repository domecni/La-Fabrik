# Préparation Code Review - La-Fabrik

Ce document est une fiche de révision pour préparer la code review.

Il est basé sur `develop`, après le merge récent autour de l'environnement, du repair game, de l'audio, du store Zustand, du hand tracking, de l'éditeur et de la doc intégrée.

Le but n'est pas de réciter le repo. Le but est de savoir :

- expliquer l'architecture générale ;
- naviguer vite entre les bons fichiers ;
- défendre les choix techniques ;
- montrer une démo propre avec Chrome DevTools ;
- reconnaître honnêtement les limites actuelles.

## Ce qu'il faut retenir en premier

La-Fabrik est une expérience web 3D en React, Vite, Three.js et React Three Fiber.

Le joueur est dans un monde 3D et avance dans une progression de réparation :

```txt
intro -> bike -> pylone -> ferme -> outro
```

Les trois piliers à connaître pour la review :

1. `RepairGame` : boucle de gameplay principale.
2. `AudioManager` : musique, SFX, dialogues et sous-titres.
3. `useGameStore` / Zustand : progression globale du jeu.

Le reste du repo sert à intégrer ces piliers :

- `World` monte la scène 3D ;
- `InteractionManager` relie les objets interactifs aux inputs ;
- `HandTrackingProvider` active la webcam seulement quand elle est utile ;
- `/editor` permet de modifier map, dialogues, SRT et cinématiques ;
- `/docs` rend la documentation Markdown dans l'app.

## Pitch en 30 secondes

Phrase simple à savoir dire :

> La-Fabrik est une expérience 3D interactive en React Three Fiber. Le joueur progresse dans des missions de réparation. Le coeur du gameplay est un `RepairGame` réutilisable pour le vélo, le pylône et la ferme. La progression est centralisée dans Zustand, les interactions passent par un manager commun, les objets manipulables utilisent Rapier, et le joueur garde une collision octree séparée. L'audio est géré par un `AudioManager` avec volumes par catégorie, dialogues et sous-titres.

## Carte mentale du projet

```txt
src/main.tsx
  -> App.tsx
    -> router.tsx
      -> /        HomePage + Canvas + World + GameUI
      -> /editor  EditorPage
      -> /docs    DocsLayout + Markdown pages
```

Dans la scène jouable :

```txt
HomePage
  -> HandTrackingProvider
  -> Canvas
    -> World
      -> GameMap
      -> GameStageContent
        -> RepairGame bike/pylone/ferme
      -> GameMusic
      -> GameDialogues
      -> Player
  -> GameUI
```

## Features à connaître

### Runtime 3D

Fichiers :

- `src/pages/page.tsx`
- `src/world/World.tsx`
- `src/hooks/world/useWorldSceneLoading.ts`
- `src/world/GameMap.tsx`
- `src/world/GameMapCollision.tsx`

Ce que ça fait :

- charge `public/map.json` ;
- résout les modèles dans `public/models/{name}/model.glb` ou `model.gltf` ;
- affiche des cubes fallback si un modèle manque ;
- construit l'octree joueur depuis les nodes de collision ;
- attend que map, collision, stage et octree soient prêts avant de spawn le joueur.

Phrase à retenir :

> `World` ne lance pas tout d'un coup. Il attend que la map, l'octree et le stage gameplay soient prêts avant de monter le joueur, la musique et les dialogues.

Piège à connaître :

Les anciens flags comme `noMusic`, `noMap`, `noDialogues`, `noPlayer` ne sont plus branchés dans `World`. Pour la démo, utiliser surtout `?debug`.

### Player et collision

Fichiers :

- `src/world/player/PlayerController.tsx`
- `src/data/input/keybindings.ts`
- `src/data/player/playerConfig.ts`
- `src/world/GameMapCollision.tsx`

Ce que ça fait :

- déplacement `ZQSD` ;
- souris en pointer lock ;
- saut avec `Space` ;
- interaction avec `E` ;
- grab avec clic gauche ;
- collision joueur via capsule Three.js + octree.

Phrase à retenir :

> Le joueur n'est pas piloté par Rapier. Rapier sert aux objets manipulables, alors que le joueur utilise une capsule et un octree.

Piège à connaître :

`useRepairMovementLocked()` retourne actuellement `false`. Le lock de mouvement est prévu dans le code et l'UI, mais il est désactivé sur `develop`.

### Interaction

Fichiers :

- `src/managers/InteractionManager.ts`
- `src/hooks/interaction/useInteraction.ts`
- `src/components/three/interaction/InteractableObject.tsx`
- `src/components/three/interaction/TriggerObject.tsx`
- `src/components/three/interaction/GrabbableObject.tsx`
- `src/components/ui/InteractPrompt.tsx`

Ce que ça fait :

- détecte si un objet est proche ;
- raycast depuis la caméra pour savoir si le joueur vise l'objet ;
- affiche le prompt `E` pour les triggers ;
- gère les grabs souris et hand tracking ;
- expose un snapshot React via `useSyncExternalStore`.

Phrase à retenir :

> Les interactions sont séparées du gameplay. Un objet dit juste "je suis trigger" ou "je suis grabbable", puis le player controller déclenche l'action selon le focus courant.

### Repair game

Fichiers coeur :

- `src/components/three/gameplay/RepairGame.tsx`
- `src/components/three/gameplay/RepairRepairingStep.tsx`
- `src/components/three/gameplay/RepairScanSequence.tsx`
- `src/components/three/gameplay/RepairMissionCase.tsx`
- `src/components/three/gameplay/RepairCaseModel.tsx`
- `src/components/three/gameplay/RepairCompletionStep.tsx`

Fichiers data/state :

- `src/data/gameplay/repairMissions.ts`
- `src/data/gameplay/repairCaseConfig.ts`
- `src/data/gameplay/repairGameConfig.ts`
- `src/types/gameplay/repairMission.ts`
- `src/managers/stores/useGameStore.ts`

Flow :

```txt
locked
  -> waiting
  -> inspected
  -> fragmented
  -> scanning
  -> repairing
  -> reassembling
  -> done
```

Ce que ça fait :

- inspecter l'objet de mission ;
- afficher une mallette ;
- ouvrir/interagir avec la mallette ;
- fragmenter le modèle ;
- scanner les pièces cassées ;
- proposer plusieurs pièces de remplacement ;
- attraper et snapper les pièces ;
- vérifier bonne pièce + pièces cassées rangées ;
- réassembler le modèle ;
- valider la mission et passer à la suivante.

Phrase à retenir :

> `RepairGame` est un orchestrateur de steps. Les variations entre vélo, pylône et ferme sont dans `repairMissions.ts`, pas hardcodées dans trois composants séparés.

### Audio, dialogues, sous-titres

Fichiers :

- `src/managers/AudioManager.ts`
- `src/world/GameMusic.tsx`
- `src/utils/dialogues/playDialogue.ts`
- `src/utils/dialogues/loadDialogueManifest.ts`
- `src/managers/stores/useSettingsStore.ts`
- `src/managers/stores/useSubtitleStore.ts`
- `src/components/ui/Subtitles.tsx`

Ce que ça fait :

- musique en loop ;
- sons one-shot avec pooling ;
- volumes par catégorie : `music`, `sfx`, `dialogue` ;
- dialogues depuis `public/sounds/dialogue/dialogues.json` ;
- SRT par voix et par langue ;
- sous-titres synchronisés avec `audio.currentTime` ;
- queue de dialogues pour éviter les overlaps.

Phrase à retenir :

> L'audio est impératif, donc il est dans un manager. React garde les réglages et les sous-titres, mais les vrais `HTMLAudioElement` sont gérés par `AudioManager`.

### Zustand

Fichiers :

- `src/managers/stores/useGameStore.ts`
- `src/managers/stores/useSettingsStore.ts`
- `src/managers/stores/useSubtitleStore.ts`
- `src/components/ui/debug/GameStateDebugPanel.tsx`

Ce que ça fait :

- `useGameStore` : progression globale ;
- `useSettingsStore` : menu, volumes, sous-titres, runtime repair ;
- `useSubtitleStore` : sous-titre actif ;
- debug panel : manipule le même store que le vrai gameplay.

Phrase à retenir :

> Zustand contient l'état durable. Les valeurs qui changent à chaque frame restent dans des refs, dans R3F ou dans les managers.

### Hand tracking

Fichiers :

- `src/providers/gameplay/HandTrackingProvider.tsx`
- `src/hooks/handTracking/useRemoteHandTracking.ts`
- `src/hooks/handTracking/useBrowserHandTracking.ts`
- `src/hooks/handTracking/useBothFistsHold.ts`
- `src/components/three/handTracking/HandTrackingGlove.tsx`
- `backend/main.py`

Ce que ça fait :

- source `backend` avec Python/FastAPI/MediaPipe ;
- source `browser` avec `@mediapipe/tasks-vision` ;
- activation seulement quand utile ;
- gesture deux poings fermés ;
- grab à la main pour certains objets ;
- visualisation gants et panel debug.

Phrase à retenir :

> Le hand tracking n'est pas actif tout le temps. Le provider l'active quand le contexte le justifie, par exemple pendant certaines étapes du repair game.

### Editor

Fichiers :

- `src/pages/editor/page.tsx`
- `src/components/editor/EditorControls.tsx`
- `src/components/editor/scene/EditorScene.tsx`
- `src/components/editor/scene/EditorMap.tsx`
- `vite.config.ts`

Ce que ça fait :

- édite `public/map.json` ;
- affiche et transforme les objets ;
- édite dialogues, SRT et cinématiques ;
- preview audio/cinématique ;
- sauvegarde locale via endpoints Vite.

Phrase à retenir :

> L'éditeur partage les mêmes formats que le runtime. Il n'y a pas un format map pour l'éditeur et un autre pour le jeu.

Piège à connaître :

Les endpoints `/api/save-*` sont des helpers Vite en dev local, pas une API de production.

## Bloc principal 1 : RepairGame

### Ce qu'il faut comprendre

`RepairGame` ne fait pas "juste afficher une réparation". Il coordonne :

- le state global Zustand ;
- les étapes de mission ;
- les assets GLTF ;
- les prompts vidéo ;
- la mallette ;
- les interactions `E` ;
- les objets Rapier grabbables ;
- le scan des pièces ;
- la validation gameplay.

### Navigation simple

Ouvrir dans cet ordre :

1. `src/world/GameStageContent.tsx`
2. `src/components/three/gameplay/RepairGame.tsx`
3. `src/data/gameplay/repairMissions.ts`
4. `src/components/three/gameplay/RepairRepairingStep.tsx`
5. `src/managers/stores/useGameStore.ts`

### Comment expliquer l'architecture

`GameStageContent` place les missions dans le monde.

`RepairGame` reçoit une mission :

```tsx
<RepairGame mission="bike" position={[8, 0, -6]} />
```

Puis il vérifie :

- est-ce que `mainState` correspond à cette mission ?
- quel est le `step` courant ?
- quelle config utiliser ?
- quel sous-composant monter ?

Les variations mission sont dans `repairMissions.ts` :

- modèle ;
- prompt vidéo ;
- pièces cassées ;
- bonnes pièces ;
- leurres ;
- timings ;
- placeholders.

### Pourquoi c'est bien

- Un seul flow réutilisable.
- Moins de duplication entre `bike`, `pylone`, `ferme`.
- Les règles générales restent dans les composants.
- Les variations restent dans la data.
- Le debug panel peut tester les mêmes steps que le vrai jeu.

### Compromis

Si une future mission devient très différente, la config ne suffira peut-être plus. Il faudra alors créer des composants spécifiques ou un vrai `MissionManager`.

### Points à dire si on ouvre `RepairRepairingStep`

Ce fichier gère l'étape la plus gameplay :

- pièces de remplacement ;
- pièces cassées à déposer ;
- snap vers placeholders ;
- feedback vert/rouge/bleu ;
- validation finale.

État local important :

- `placedPartIds`
- `depositedBrokenPartIds`
- `showBlockedInstallFeedback`

Phrase simple :

> Cette étape garde seulement l'état local de manipulation. La progression globale reste dans Zustand.

## Bloc principal 2 : Audio

### Ce qu'il faut comprendre

`AudioManager` est un singleton parce qu'il manipule des objets impératifs du navigateur :

- `HTMLAudioElement`
- `AudioContext`
- pools audio
- panner stereo
- musique active

### Navigation simple

Ouvrir dans cet ordre :

1. `src/managers/AudioManager.ts`
2. `src/world/GameMusic.tsx`
3. `src/managers/stores/useSettingsStore.ts`
4. `src/utils/dialogues/playDialogue.ts`
5. `src/components/ui/Subtitles.tsx`

### Architecture audio

Catégories :

```txt
music
sfx
dialogue
```

Volumes :

```txt
volume effectif = volume de base * volume catégorie
```

Exemple :

- `GameMusic` lance `/sounds/musique/test.mp3` avec base `0.33`.
- Si le volume musique settings vaut `0.5`, le volume effectif vaut `0.165`.

### Dialogues et sous-titres

Un dialogue référence :

- un `id` ;
- une voix ;
- un fichier audio ;
- un index de cue SRT.

Le SRT est par voix et par langue, pas un fichier SRT par dialogue.

Phrase simple :

> Les dialogues utilisent la catégorie audio `dialogue`, et `playDialogueById` synchronise le sous-titre actif avec le temps courant de l'audio.

### Risques à connaître

- Autoplay navigateur : la musique peut attendre un input utilisateur.
- Un seul track musique actif à la fois.
- Les dialogues sont queue-based, pas un vrai système de priorité.
- L'éditeur audio/SRT sauve via Vite local, pas en prod.

## Bloc principal 3 : Zustand

### Ce qu'il faut comprendre

Zustand contient l'état durable.

Il ne contient pas :

- la velocity joueur ;
- les raycasts ;
- les positions frame par frame ;
- les vecteurs temporaires ;
- l'état interne d'un grab.

### Navigation simple

Ouvrir dans cet ordre :

1. `src/managers/stores/useGameStore.ts`
2. `src/components/ui/debug/GameStateDebugPanel.tsx`
3. `src/components/three/gameplay/RepairGame.tsx`
4. `src/managers/stores/useSettingsStore.ts`
5. `src/managers/stores/useSubtitleStore.ts`

### Game store

Main states :

```txt
intro
bike
pylone
ferme
outro
```

Mission steps :

```txt
locked
waiting
inspected
fragmented
scanning
repairing
reassembling
done
```

Actions importantes :

- `setMissionStep`
- `completeMission`
- `advanceGameState`
- `rewindGameState`
- `resetGame`

Phrase simple :

> Le debug panel et le vrai gameplay utilisent la même source de vérité. Ce n'est pas un debug state séparé.

### Settings store

Gère :

- menu ouvert/fermé ;
- volumes ;
- sous-titres ;
- langue ;
- `repairRuntime`.

Piège :

`repairRuntime` est stocké et affiché, mais pas encore utilisé par `RepairGame`.

### Subtitle store

Gère seulement :

- le sous-titre actif ;
- clear/set.

Phrase simple :

> Le store de sous-titres est volontairement petit parce que le timing reste piloté par l'audio.

## Les pièges à ne pas rater

Si on te pose une question précise, réponds vrai.

| Sujet                     | Réponse honnête                                                          |
| ------------------------- | ------------------------------------------------------------------------ |
| Lock mouvement réparation | Le hook existe mais retourne `false`, donc pas actif actuellement.       |
| `repairRuntime` JS/Python | Le choix est stocké dans settings, mais pas consommé par le repair game. |
| Old debug flags           | `noMusic`, `noMap`, `noDialogues`, etc. ne sont plus branchés.           |
| Player physics            | Le joueur n'est pas Rapier, il utilise capsule + octree.                 |
| Collision map             | L'octree vient de nodes dédiés, actuellement `terrain`.                  |
| Editor save               | Ce sont des endpoints Vite dev, pas une API de prod.                     |
| Cinematics                | `GameCinematics` est monté seulement pendant `outro` dans `World`.       |
| Hand tracking depth       | Le `z` MediaPipe est relatif, pas une vraie profondeur monde stable.     |

## Si l'évaluateur ouvre un fichier au hasard

| Fichier                    | Ce qu'il faut dire                                                            |
| -------------------------- | ----------------------------------------------------------------------------- |
| `World.tsx`                | Compositeur de scène. Gère game/debug, loading gates, player spawn.           |
| `useWorldSceneLoading.ts`  | Évite de spawn le joueur avant map + collision + stage.                       |
| `GameMap.tsx`              | Charge map JSON, modèles, fallback cubes, signale quand les nodes sont prêts. |
| `GameMapCollision.tsx`     | Construit l'octree joueur depuis des nodes de collision dédiés.               |
| `PlayerController.tsx`     | Inputs, pointer lock, mouvement, jump, interaction, collision capsule.        |
| `InteractionManager.ts`    | État courant des interactions, pas dans Zustand car frame-adjacent.           |
| `RepairGame.tsx`           | Orchestrateur de steps repair, data-driven par mission.                       |
| `RepairRepairingStep.tsx`  | Validation gameplay : pièces, snap, dépôt, install target.                    |
| `repairMissions.ts`        | Config des missions, évite de hardcoder chaque mission dans le composant.     |
| `AudioManager.ts`          | Manager impératif pour musique, SFX, dialogue, pooling, volumes.              |
| `playDialogue.ts`          | Queue dialogue + synchronisation sous-titre.                                  |
| `useGameStore.ts`          | Source de vérité progression.                                                 |
| `GameStateDebugPanel.tsx`  | Outil debug qui manipule le même store que le jeu.                            |
| `HandTrackingProvider.tsx` | Active la webcam seulement quand utile.                                       |
| `GrabbableObject.tsx`      | Grab souris/main, Rapier body, snap target.                                   |
| `EditorControls.tsx`       | Panneau éditeur, pas runtime joueur.                                          |

## Démo live avec Chrome DevTools

Cette partie correspond à :

> Session de test / démo live via les devtools, commentée

Le but n'est pas de tout montrer. Le but est de montrer que tu sais observer l'application proprement.

### Préparation

Lancer le front :

```bash
npm run dev
```

Ouvrir :

```txt
http://localhost:5173/?debug
```

Si Vite affiche un autre port, utiliser ce port.

Ouvrir DevTools :

- macOS : `Cmd + Option + I`
- Windows/Linux : `Ctrl + Shift + I`

Disposition conseillée :

- app à gauche ;
- DevTools docké à droite ;
- onglets prêts : `Console`, `Network`, `Sources`, `Application`.

### Étape 1 : Console

Objectif :

- vérifier que l'app ne crashe pas ;
- surveiller les erreurs quand on interagit.

À faire :

1. Ouvrir `Console`.
2. Reload la page.
3. Vérifier s'il y a des erreurs rouges.
4. Garder la console ouverte pendant la démo.

Phrase simple :

> Je commence par la console pour vérifier que la démo ne cache pas une erreur runtime.

### Étape 2 : Network

Objectif :

- montrer que les assets sont chargés ;
- vérifier map, modèles, sons, vidéos.

À faire :

1. Ouvrir `Network`.
2. Cocher `Disable cache`.
3. Reload.
4. Filtrer :
   - `map.json`
   - `model.gltf`
   - `.webm`
   - `.mp3`
   - `.srt`

Ce que tu peux expliquer :

- `map.json` décrit la scène ;
- `model.gltf` charge les assets 3D ;
- `.webm` sert aux prompts in-game ;
- `.mp3` sert à musique/dialogues/SFX ;
- `.srt` sert aux sous-titres.

Phrase simple :

> Network me permet de vérifier que la feature n'est pas juste du code React, elle dépend aussi d'assets runtime.

### Étape 3 : Sources pour suivre le repair game

Objectif :

- montrer une transition de step ;
- prouver que `RepairGame` écrit dans Zustand.

À faire :

1. Ouvrir `Sources`.
2. `Cmd + P` ou `Ctrl + P`.
3. Chercher `RepairGame.tsx`.
4. Mettre un breakpoint sur un appel à `setMissionStep`.
5. Chercher `useGameStore.ts`.
6. Mettre un breakpoint dans `setMissionStep` ou `completeMission`.

Dans l'app :

1. Activer `?debug`.
2. Dans lil-gui, mettre `Scene = Physics`.
3. Garder `Camera Mode = Player`.
4. Dans le debug overlay, passer `Main state = Bike`.
5. Mettre le sub-state sur `waiting` si besoin.
6. Interagir avec l'objet ou avancer les steps via le debug panel.

Quand le breakpoint pause :

- regarder `mission` ;
- regarder `step` ;
- expliquer la transition.

Phrase simple :

> Là on voit que le composant ne change pas juste son état local. Il déclenche une transition dans le store global.

### Étape 4 : Sources pour suivre l'audio

Objectif :

- montrer qu'un son passe par `AudioManager`.

À faire :

1. Ouvrir `AudioManager.ts`.
2. Mettre un breakpoint dans `playSound`.
3. Déclencher un son, par exemple ouverture/fermeture de mallette.
4. Inspecter :
   - `path`
   - `volume`
   - `options.category`

Ensuite :

1. Ouvrir le menu avec `Escape`.
2. Changer le volume SFX.
3. Mettre un breakpoint dans `setCategoryVolume`.
4. Vérifier que la catégorie change.

Phrase simple :

> Les sliders ne modifient pas directement un audio isolé. Ils mettent à jour un volume de catégorie dans le manager.

### Étape 5 : Application

Objectif :

- montrer les données locales du navigateur.

À faire :

1. Ouvrir `Application`.
2. Regarder `Local Storage`.
3. Chercher la clé de debug :

```txt
la-fabrik-debug-controls
```

Ce que ça montre :

- certains choix debug peuvent être persistés ;
- ce n'est pas la progression du jeu ;
- c'est juste du confort dev.

### Étape 6 : Performance, optionnel

Objectif :

- montrer que tu sais diagnostiquer si ça rame.

À faire seulement si demandé :

1. Ouvrir `Performance`.
2. Record 5 secondes.
3. Bouger dans la scène.
4. Stop.
5. Observer FPS, scripting, rendering.

Phrase simple :

> Si la scène rame, je ne devine pas. Je regarde si le temps part dans le JS, le rendu, ou le chargement d'assets.

## Démo recommandée en 5 minutes

### 1. Ouvrir la scène debug

```txt
http://localhost:5173/?debug
```

Dans lil-gui :

- `Scene = Physics`
- `Camera Mode = Player`
- `Debug Overlay = true`

### 2. Montrer le store

Dans le debug panel :

- passer `Main state = Bike`
- passer le step à `waiting`
- avancer avec `Next step`

Expliquer :

> Le panel debug écrit dans le même store que le vrai gameplay.

### 3. Montrer le repair game

Faire défiler les steps :

```txt
waiting -> inspected -> fragmented -> scanning -> repairing
```

Montrer :

- objet de mission ;
- mallette ;
- modèle éclaté ;
- scan ;
- pièces à grab ;
- validation bloquée si mauvaise pièce.

### 4. Montrer l'audio

Ouvrir DevTools :

- breakpoint dans `AudioManager.playSound` ;
- déclencher un son ;
- montrer `path` et `category`.

### 5. Montrer Zustand

Breakpoint dans `useGameStore`.

Expliquer :

> Quand la mission avance, ce n'est pas chaque composant qui invente son état. La progression passe par des actions centralisées.

## Questions probables et réponses simples

### Pourquoi Zustand ?

Parce qu'on a besoin d'une source de vérité partagée entre UI, monde 3D, debug panel et gameplay.

### Pourquoi pas tout dans Zustand ?

Parce que certaines valeurs changent trop souvent. Les positions, vitesses, raycasts et animations frame par frame restent dans des refs ou dans les composants R3F.

### Pourquoi un `AudioManager` ?

Parce que l'audio navigateur est impératif. On doit gérer des `HTMLAudioElement`, des pools, une musique active et des volumes de catégories.

### Pourquoi séparer octree et Rapier ?

Pour garder un player controller simple tout en utilisant Rapier pour les objets manipulables.

### Pourquoi `RepairGame` est data-driven ?

Pour réutiliser le même flow sur plusieurs missions et garder les variations dans `repairMissions.ts`.

### Qu'est-ce qui est incomplet ?

- pas de vrai `GameManager` global ;
- lock mouvement réparation désactivé ;
- `repairRuntime` pas consommé ;
- editor save uniquement en dev ;
- hand tracking encore approximatif sur profondeur et smoothing.

## Checklist avant la review

Commandes :

```bash
npm run format:check
npm run typecheck
npm run lint
npm run build
```

Pages à ouvrir :

- `/`
- `/?debug`
- `/editor`
- `/docs`
- `/docs/code-review`

Fichiers à avoir en tête :

- `src/world/World.tsx`
- `src/components/three/gameplay/RepairGame.tsx`
- `src/components/three/gameplay/RepairRepairingStep.tsx`
- `src/data/gameplay/repairMissions.ts`
- `src/managers/AudioManager.ts`
- `src/managers/stores/useGameStore.ts`
- `src/components/ui/debug/GameStateDebugPanel.tsx`

Réponses pièges à réviser :

- lock mouvement repair désactivé actuellement ;
- `repairRuntime` pas consommé ;
- player pas Rapier ;
- save editor pas production ;
- old boot flags non branchés.

## Mini plan de révision

### Session 1 : 20 minutes

Lire :

- cette fiche ;
- `docs/technical/repair-game.md` ;
- `docs/technical/zustand.md`.

Objectif :

- savoir expliquer le repair game et le store.

### Session 2 : 20 minutes

Lire :

- `docs/technical/audio.md` ;
- `docs/technical/interaction.md`.

Objectif :

- savoir expliquer audio + interaction.

### Session 3 : 20 minutes

Faire la démo :

- lancer `npm run dev` ;
- ouvrir `/?debug` ;
- ouvrir DevTools ;
- faire un breakpoint dans `RepairGame` ;
- faire un breakpoint dans `AudioManager`.

Objectif :

- ne pas découvrir DevTools le jour de la review.

## Version ultra-courte à garder en tête

Si tu paniques, reviens à ça :

```txt
World monte la scène.
GameStageContent place les missions.
RepairGame orchestre les steps.
repairMissions fournit la data.
useGameStore garde la progression.
InteractionManager gère focus/trigger/grab.
AudioManager gère sons, musique, dialogues.
DevTools permet de suivre assets, state et appels runtime.
```
