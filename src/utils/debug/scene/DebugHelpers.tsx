import {
  DEBUG_AXES_SIZE,
  DEBUG_GRID_DIVISIONS,
  DEBUG_GRID_PRIMARY_COLOR,
  DEBUG_GRID_SECONDARY_COLOR,
  DEBUG_GRID_SIZE,
  DEBUG_GRID_Y,
} from "@/data/debugConfig";
import { Debug } from "@/utils/debug/Debug";

export function DebugHelpers(): React.JSX.Element | null {
  const debug = Debug.getInstance();

  if (!debug.active) {
    return null;
  }

  return (
    <>
      <gridHelper
        args={[
          DEBUG_GRID_SIZE,
          DEBUG_GRID_DIVISIONS,
          DEBUG_GRID_PRIMARY_COLOR,
          DEBUG_GRID_SECONDARY_COLOR,
        ]}
        position={[0, DEBUG_GRID_Y, 0]}
      />
      <axesHelper args={[DEBUG_AXES_SIZE]} />
    </>
  );
}
