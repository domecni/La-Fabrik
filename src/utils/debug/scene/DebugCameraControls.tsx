import { OrbitControls } from "@react-three/drei";
import {
  DEBUG_CAMERA_DAMPING_FACTOR,
  DEBUG_CAMERA_MAX_DISTANCE,
  DEBUG_CAMERA_MIN_DISTANCE,
} from "@/data/debugConfig";
import {
  PLAYER_EYE_HEIGHT,
  PLAYER_SPAWN_X,
  PLAYER_SPAWN_Z,
} from "@/data/playerConfig";

export function DebugCameraControls(): React.JSX.Element {
  return (
    <OrbitControls
      enableDamping
      dampingFactor={DEBUG_CAMERA_DAMPING_FACTOR}
      minDistance={DEBUG_CAMERA_MIN_DISTANCE}
      maxDistance={DEBUG_CAMERA_MAX_DISTANCE}
      target={[PLAYER_SPAWN_X, PLAYER_EYE_HEIGHT, PLAYER_SPAWN_Z]}
    />
  );
}
