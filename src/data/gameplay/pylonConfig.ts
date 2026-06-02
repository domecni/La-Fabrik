import type { Vector3Tuple } from "@/types/three/three";

export const PYLON_WORLD_POSITION: Vector3Tuple = [-31.5, 3.5, 36.04];

export const PYLON_DOWNED_ROTATION: Vector3Tuple = [0, 0, -0.9];

export const PYLON_UPRIGHT_ROTATION: Vector3Tuple = [0, 0, 0];

export const PYLON_FARMER_NPC_POSITION: Vector3Tuple = [
  -16.13,
  3.2,
  52.46
];

export const PYLON_FARMER_NPC_AFTER_POSITION: Vector3Tuple = [
  PYLON_WORLD_POSITION[0] + 3,
  PYLON_WORLD_POSITION[1] + 0.2,
  PYLON_WORLD_POSITION[2],
];

/** Point vers lequel l'électricienne regarde pendant sa marche vers le pylône (ajustable) */
export const PYLON_FARMER_NPC_WALK_LOOK_AT: Vector3Tuple = [
  PYLON_WORLD_POSITION[0] + 3,
  PYLON_WORLD_POSITION[1] + 0.2,
  PYLON_WORLD_POSITION[2],
];

/** Position finale du PNJ quand le pylône se redresse */
export const PYLON_FARMER_NPC_AFTER_POSITION_pylone_straight: Vector3Tuple = [
  PYLON_WORLD_POSITION[0] + 1,
  PYLON_WORLD_POSITION[1],
  PYLON_WORLD_POSITION[2],
];

/** Rotation (X Y Z radians) du PNJ une fois arrivé sous le pylône */
export const PYLON_FARMER_NPC_AFTER_ROTATION: Vector3Tuple = [0, 0, 0];

/** Scale uniforme du PNJ une fois arrivé sous le pylône */
export const PYLON_FARMER_NPC_AFTER_SCALE = 1.55;

/** Vitesse du lerp de déplacement du PNJ (unités/s) */
export const PYLON_FARMER_NPC_WALK_SPEED = 2;

export const PYLON_NARRATIVE_INTERACT_RADIUS = 3.5;

export const PYLON_STRAIGHTEN_ANIMATION_DURATION_MS = 2200;

export const PYLON_NARRATIVE_DIALOGUES = {
  electricOutage: "narrateur_coupureelec",
  searchCentral: "narrateur_fouillelecentre",
  brokenPylon: "narrateur_poteaueleccasse",
  demandeAide: "narrateur_demande_aide",
  farmerHelp: "fermier_coupdemain",
  electricienneWelcome: "electricienne_welcome",
  electricienneApresMontage: "electricienne_apresMontage",
  electricienneAurevoir: "electricienne_aurevoir",
  powerRestored: "narrateur_courantrepare",
} as const;
