import { Suspense, lazy } from "react";
import { Debug } from "@/utils/debug/Debug";

const Perf = lazy(() => import("r3f-perf").then((m) => ({ default: m.Perf })));

const DEBUG_GUI_WIDTH = 245;
const DEBUG_PANEL_GAP = 20;

export function DebugPerf(): React.JSX.Element | null {
  const debug = Debug.getInstance();

  if (!debug.active) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Perf
        position="top-right"
        style={{ right: DEBUG_GUI_WIDTH + DEBUG_PANEL_GAP }}
      />
    </Suspense>
  );
}
