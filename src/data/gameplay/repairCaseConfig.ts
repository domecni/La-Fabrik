import type { Vector3Tuple } from "@/types/three/three";
import { assetUrl } from "@/utils/assetUrl";

export const REPAIR_CASE_MODEL_PATH = "/models/packderelance/model.gltf";
export const REPAIR_CASE_OPEN_SOUND_PATH = assetUrl(
  "/sounds/effect/open-malette.mp3",
);
export const REPAIR_CASE_CLOSE_SOUND_PATH = assetUrl(
  "/sounds/effect/close-malette.mp3",
);

export const REPAIR_CASE_LID_NODE_NAME = "partsup";
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

/**
 * Names of nodes inside the packderelance GLTF where standalone part models
 * are anchored (visually injected). The original meshes under these nodes are
 * hidden at runtime so the standalone model takes their place.
 *
 * Some entries (e.g. `refroidisseur`) do not exist as nodes in the GLTF; an
 * empty Object3D is created at mount time at the corresponding case-local
 * fallback position so the anchoring pipeline is uniform.
 */
export const REPAIR_CASE_PART_ANCHOR_NAMES = [
  "cabledroit",
  "cablegauche",
  "pucehaut",
  "pucebas",
  "refroidisseur",
] as const;

export type RepairCasePartAnchorName =
  (typeof REPAIR_CASE_PART_ANCHOR_NAMES)[number];

/**
 * Case-local positions used when an anchor node is missing from the GLTF.
 * Values are expressed in the case model's local coordinate system (the case
 * is rendered at small intrinsic scale; magnitudes are in the 0.01-0.25 range
 * to match the existing nodes such as `cabledroit`).
 */
export const REPAIR_CASE_PART_ANCHOR_FALLBACKS: Record<
  RepairCasePartAnchorName,
  Vector3Tuple
> = {
  cabledroit: [0.0087, 0.0139, 0.1921],
  cablegauche: [0.0087, 0.0139, 0.2477],
  pucehaut: [-0.0207, 0.009, -0.0479],
  pucebas: [0.0987, 0.009, -0.0479],
  refroidisseur: [0.05, 0.014, 0.05],
};

/**
 * Quaternion applied to anchor nodes that are created at runtime (because
 * the corresponding node is absent from the GLTF). Matches the rotation of
 * the existing part nodes in packderelance to keep visual orientation
 * consistent.
 */
export const REPAIR_CASE_PART_ANCHOR_FALLBACK_QUATERNION = [
  0.7071068286895752, 0, 0, 0.7071068286895752,
] as const satisfies readonly [number, number, number, number];
