import { GameStateDebugPanel } from "@/components/ui/debug/GameStateDebugPanel";
import { HandTrackingDebugPanel } from "@/components/ui/debug/HandTrackingDebugPanel";
import { useShowDebugOverlay } from "@/hooks/debug/useShowDebugOverlay";

export function DebugOverlayLayout(): React.JSX.Element | null {
  const showDebugOverlay = useShowDebugOverlay();

  if (!showDebugOverlay) return null;

  return (
    <aside className="debug-overlay-layout" aria-label="Debug overlay panels">
      <header className="debug-overlay-layout__header">
        <span className="debug-overlay-layout__kicker">Debug overlay</span>
      </header>

      <div className="debug-overlay-layout__sections">
        <HandTrackingDebugPanel />
        <GameStateDebugPanel />
      </div>
    </aside>
  );
}
