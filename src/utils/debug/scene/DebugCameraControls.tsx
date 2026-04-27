import { OrbitControls } from "@react-three/drei";
import {
  DEBUG_CAMERA_DAMPING_FACTOR,
  DEBUG_CAMERA_MAX_DISTANCE,
  DEBUG_CAMERA_MIN_DISTANCE,
} from "@/data/debugConfig";
import {
  PLAYER_EYE_HEIGHT,
  PLAYER_SPAWN_POSITION_GAME,
} from "@/data/playerConfig";

const DEBUG_CAMERA_TARGET = [
  PLAYER_SPAWN_POSITION_GAME[0],
  PLAYER_EYE_HEIGHT,
  PLAYER_SPAWN_POSITION_GAME[2],
] as const;

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
