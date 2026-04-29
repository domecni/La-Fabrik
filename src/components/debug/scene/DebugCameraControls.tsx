import { OrbitControls } from "@react-three/drei";
import {
  DEBUG_CAMERA_DAMPING_FACTOR,
  DEBUG_CAMERA_MAX_DISTANCE,
  DEBUG_CAMERA_MIN_DISTANCE,
} from "@/data/debug/debugConfig";
import {
  PLAYER_EYE_HEIGHT,
  PLAYER_SPAWN_POSITION_GAME,
} from "@/data/player/playerConfig";
import type { Vector3Tuple } from "@/types/three";

const DEBUG_CAMERA_TARGET: Vector3Tuple = [
  PLAYER_SPAWN_POSITION_GAME[0],
  PLAYER_EYE_HEIGHT,
  PLAYER_SPAWN_POSITION_GAME[2],
];

export function DebugCameraControls(): React.JSX.Element {
  return (
    <OrbitControls
      enableDamping
      dampingFactor={DEBUG_CAMERA_DAMPING_FACTOR}
      minDistance={DEBUG_CAMERA_MIN_DISTANCE}
      maxDistance={DEBUG_CAMERA_MAX_DISTANCE}
      target={DEBUG_CAMERA_TARGET}
    />
  );
}
