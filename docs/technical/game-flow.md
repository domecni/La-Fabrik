# Game Flow - La Fabrik

## Étapes du jeu

```
intro → start-intro → naming → bienvenue → star-move → mission2 → searching_problem → preparation → outOfFabrik
```

---

## Détail des étapes

### 1. `intro` (initial)

- État initial au chargement du jeu
- Aucune action, juste une étape de départ
- Transition automatique vers `start-intro`

### 2. `start-intro`

- **Déclenchement** : Auto-transition depuis `intro` quand la scène est chargée
- **Action** : Joue l'audio d'intro (`intro`)
- **Attente** : Attend que l'audio se termine
- **Transition** : Vers `naming` quand l'audio se termine

### 3. `naming`

- **Déclenchement** : Quand l'audio d'intro se termine
- **Action** : Affiche un input pour demander le prénom du joueur
- **Attente** : L'utilisateur entre son prénom et valide
- **Transition** : Vers `bienvenue` quand l'utilisateur valide

### 4. `bienvenue`

- **Déclenchement** : Quand l'utilisateur valide son prénom
- **Actions** :
  - Affiche "Bienvenue {prénom} !" à l'écran
  - Joue l'audio de bienvenue
- **Attente** : Attend que l'audio se termine
- **Transition** : Vers `star-move` quand l'audio se termine

### 5. `star-move`

- **Déclenchement** : Quand l'audio de bienvenue se termine
- **Action** : Active le mouvement du joueur (`setCanMove(true)`)
- **État** : Le joueur peut maintenant se déplacer librement
- **Zone** : La détection de zone devient active (ZoneDetection)

### 6. `mission2`

- **Déclenchement** : Quand le joueur entre dans la zone `fabrikExit` (position: `[-5, 25, -15]`)
- **Actions** :
  - Stocke `activityCity: false` dans le store Zustand
  - Joue l'audio `alertCentral`
- **État** : Les systèmes lisent `activityCity` depuis `useGameStore` pour adapter leur comportement
- **Attente** : Le joueur atteint la zone de trigger pour `searching_problem`

### 7. `searching_problem`

- **Déclenchement** : Quand le joueur entre dans la zone `searchingProblemZone` (position: `[-5, 25, -30]`)
- **Actions** :
  - Joue l'audio `searchingProblem`
  - Affiche l'objet "central" (position: `[1, 15, -45]`)
- **Attente** : Le joueur interagit avec l'objet "central"

### 8. `preparation`

- **Déclenchement** : Quand le joueur interagit avec l'objet "central"
- **Actions** :
  - Bloque le mouvement (`setCanMove(false)`)
  - Cache l'objet "central"

### 9. `outOfFabrik`

- **Déclenchement** : (non implémenté pour le moment)
- **Action** : Transition vers l'étape finale

---

## Fichiers clés

| Fichier                                 | Rôle                                                      |
| --------------------------------------- | --------------------------------------------------------- |
| `src/managers/stores/useGameStore.ts`   | Store Zustand pour l'état global du jeu                   |
| `src/components/game/GameFlow.tsx`      | Gère les transitions automatiques et la lecture audio     |
| `src/components/ui/IntroUI.tsx`         | Affiche l'input pour le prénom et le message de bienvenue |
| `src/components/zone/ZoneDetection.tsx` | Détecte quand le joueur entre dans une zone               |
| `src/world/GameStageContent.tsx`        | Monte les contenus de mission dans la scène               |
| `src/data/audioConfig.ts`               | Chemins des fichiers audio                                |
| `src/data/zones.ts`                     | Configuration des zones de transition                     |

---

## Configuration audio

```typescript
// src/data/audioConfig.ts
export const AUDIO_PATHS = {
  intro: "/sounds/fa.mp3",
  bienvenue: "/sounds/fa.mp3",
  alertCentral: "/sounds/fa.mp3",
  searchingProblem: "/sounds/fa.mp3",
};
```

---

## Configuration des zones

```typescript
// src/data/zones.ts
export const ZONES: Zone[] = [
  {
    id: "fabrikExit",
    position: [-5, 25, -15],
    radius: 10,
    height: 20,
    targetStep: "mission2",
  },
  {
    id: "searchingProblemZone",
    position: [-5, 25, -30],
    radius: 10,
    height: 20,
    targetStep: "searching_problem",
  },
];
```

---

## Store Zustand

```typescript
// src/managers/stores/useGameStore.ts
interface GameState {
  mainState: MainGameState;
  missionFlow: {
    activityCity: boolean;
    canMove: boolean;
    playerName: string;
  };
}
```

---

## Debug

En mode debug (`?debug` dans l'URL), on peut voir :

- **Game Step** : L'étape actuelle dans le panneau lil-gui
- **Player Position** : Position X, Y, Z du joueur en temps réel
- **Zone Visualization** : Anneaux visuels au sol pour les zones + cylindres transparents

---

## Notes techniques

- Le mouvement du joueur est bloqué tant que `canMove` est `false`
- Le store Zustand (`useGameStore`) est la source principale de vérité
- `GameStepManager` synchronise automatiquement avec le store Zustand lors des transitions
- Les transitions via les zones utilisent `GameStepManager.transitionTo()` qui met à jour le store
- L'audio utilise un callback `onEnded` pour déclencher les transitions automatiques
