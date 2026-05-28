export const missionFlowFr = `# Flow de mission

Ce document décrit le flow prototype d'intro et de mission 2 après son intégration dans l'architecture actuelle.

## Source de vérité

L'état du flow de mission vit dans le store global du jeu :

\`\`\`txt
src/managers/stores/useGameStore.ts
\`\`\`

Le store possède le slice \`missionFlow\` :

\`\`\`ts
missionFlow: {
  activityCity: boolean;
  playerName: string;
  canMove: boolean;
  dialogMessage: string | null;
}
\`\`\`

Cela garde l'état gameplay global dans Zustand, au lieu de le répartir entre un store mission séparé ou un manager gameplay.

## Frontière des managers

Les managers restent responsables de services runtime locaux :

- \`AudioManager\` possède les éléments audio, les pools audio, la musique, le volume par catégorie et le pan stéréo.
- \`InteractionManager\` possède les handles d'interaction transitoires, focus, nearby et held.

La progression de mission n'est pas possédée par un manager. Les composants mettent à jour le store via des actions explicites comme \`setCanMove\`, \`showDialog\` et \`hideDialog\`.

## Composants runtime

- \`src/components/game/GameFlow.tsx\` réagit au store et déclenche les effets ponctuels comme l'audio d'intro et le déblocage du mouvement.
- \`src/components/zone/ZoneDetection.tsx\` lit la position caméra et fait passer le flow à une étape cible quand le joueur entre dans une zone configurée.
- \`src/pages/page.tsx\` monte les overlays HTML de mission : \`IntroUI\`, \`DialogMessage\` et \`Subtitles\`.
- \`src/world/player/PlayerController.tsx\` lit \`missionFlow.canMove\` comme lock de déplacement supplémentaire.

## Séquence d'étapes

Le prototype utilise actuellement ces étapes :

\`\`\`ts
"intro" | "start-intro" | "naming" | "bienvenue" | "star-move" | "mission2" | "searching" | "helped" | "manipulation" | "outOfFabrik"
\`\`\`

Ces étapes sont propres au prototype de flow mission. Elles ne remplacent pas \`mainState\` ni la machine d'étapes repair utilisée par \`RepairGame\`.

## Configuration des zones

Les triggers de zones vivent dans :

\`\`\`txt
src/data/zones.ts
\`\`\`

Chaque zone possède un id, une position, un rayon, une hauteur et un \`targetStep\`. \`ZoneDetection\` marque une zone comme déclenchée après sa première activation pour éviter de rejouer la même transition à chaque frame.

## Règles

- Garder l'état du flow mission dans \`useGameStore.missionFlow\`.
- Ne pas réintroduire de \`GameStepManager\` pour les transitions globales.
- Ne pas créer un second store Zustand pour le flow mission sauf si cet état devient réellement indépendant de la progression du jeu.
- Garder les effets de bord comme l'audio dans les composants ou les managers de service, mais garder la transition d'état dans le store.
- Ne pas mettre les valeurs par-frame comme la position caméra ou les distances de zones dans Zustand.
`;
