import type { Vector3Tuple } from "@/types/three/three";
import type { RepairMissionId } from "@/types/gameplay/repairMission";

export type GameStep =
  | "intro"
  | "start-intro"
  | "naming"
  | "bienvenue"
  | "star-move"
  | "mission2"
  | "searching"
  | "helped"
  | "manipulation"
  | "outOfFabrik";

export type MainGameState = "intro" | RepairMissionId | "outro";

export interface Zone {
  id: string;
  position: Vector3Tuple;
  radius: number;
  height: number;
  targetStep: GameStep;
}
