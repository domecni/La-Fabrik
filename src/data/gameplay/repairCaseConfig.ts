import type { Vector3Tuple } from "@/types/three/three";

export const REPAIR_CASE_MODEL_PATH = "/models/packderelance/model.gltf";
export const REPAIR_CASE_OPEN_SOUND_PATH = "/sounds/effect/open-malette.mp3";
export const REPAIR_CASE_CLOSE_SOUND_PATH = "/sounds/effect/close-malette.mp3";

export const REPAIR_CASE_LID_NODE_NAME = "partiesup";
export const REPAIR_CASE_CLOSED_ROTATION_OFFSET_DEGREES = 0;
export const REPAIR_CASE_OPEN_ROTATION_OFFSET_DEGREES = 115;
export const REPAIR_CASE_ANIMATION_DURATION = 0.8;
export const REPAIR_CASE_POP_DURATION = 0.45;
export const REPAIR_CASE_POP_Y_OFFSET = -0.25;
export const REPAIR_CASE_EXIT_DURATION = 0.5;
export const REPAIR_CASE_EXIT_Y_OFFSET = -0.35;

export const REPAIR_CASE_FLOAT_ACTIVATION_DISTANCE = 5;
export const REPAIR_CASE_FLOAT_HEIGHT = 1;
export const REPAIR_CASE_FLOAT_UP_SPEED = 2.4;
export const REPAIR_CASE_FLOAT_DOWN_SPEED = 1.8;
export const REPAIR_CASE_ROTATION_RESET_SPEED = 3;
export const REPAIR_CASE_ROTATION_AMPLITUDE_DEGREES = 5;

export const REPAIR_CASE_FOCUS_POSITION = [
  0, 1.05, 2.05,
] satisfies Vector3Tuple;
export const REPAIR_CASE_FOCUS_SCALE = 2.25;
export const REPAIR_CASE_PLACEHOLDER_NAME_PREFIX = "placeholder_";
export const REPAIR_CASE_PLACEHOLDER_SNAP_RADIUS = 0.65;
export const REPAIR_CASE_PLACEHOLDER_SNAP_DURATION = 0.25;
