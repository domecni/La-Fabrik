import type { Vector3Tuple } from "@/types/three/three";
import type { RepairMissionId } from "@/types/gameplay/repairMission";

export const TEST_SCENE_FLOOR_POSITION: Vector3Tuple = [0, -0.5, 0];
export const TEST_SCENE_FLOOR_SIZE: Vector3Tuple = [200, 1, 200];
export const TEST_SCENE_FLOOR_COLLIDER_HALF_EXTENTS: Vector3Tuple = [
  100, 0.5, 100,
];

export const TEST_SCENE_GRABBABLE_POSITION: Vector3Tuple = [0, 1, -3];
export const TEST_SCENE_GRABBABLE_BOX_SIZE: Vector3Tuple = [0.5, 0.5, 0.5];
export const TEST_SCENE_GRABBABLE_COLOR = "#e07b39";
export const TEST_SCENE_GRABBABLE_ROUGHNESS = 0.6;
export const TEST_SCENE_GRABBABLE_METALNESS = 0.1;

export const TEST_SCENE_TRIGGER_POSITION: Vector3Tuple = [3, 2, -3];
export const TEST_SCENE_TRIGGER_SOUND_PATH = "/sounds/effect/fa.mp3";
export const TEST_SCENE_TRIGGER_RADIUS = 0.4;
export const TEST_SCENE_TRIGGER_SEGMENTS = 32;
export const TEST_SCENE_TRIGGER_COLOR = "#3b82f6";
export const TEST_SCENE_TRIGGER_ROUGHNESS = 0.3;
export const TEST_SCENE_TRIGGER_METALNESS = 0.5;

export const TEST_SCENE_REPAIR_ZONE_MARKER_RADIUS = 1.65;
export const TEST_SCENE_REPAIR_ZONE_MARKER_TUBE_RADIUS = 0.045;

export const GAME_REPAIR_ZONES = [
  {
    mission: "ebike",
    label: "E-bike",
    color: "#38bdf8",
    position: [-12, 0, -12],
  },
  {
    mission: "pylon",
    label: "Pylon",
    color: "#facc15",
    position: [0, 0, -12],
  },
  {
    mission: "farm",
    label: "Farm",
    color: "#86efac",
    position: [12, 0, -12],
  },
] as const satisfies readonly {
  mission: RepairMissionId;
  label: string;
  color: string;
  position: Vector3Tuple;
}[];

export const TEST_SCENE_REPAIR_ZONES = GAME_REPAIR_ZONES;
