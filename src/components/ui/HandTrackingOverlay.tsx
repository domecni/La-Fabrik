import { useHandTrackingSnapshot } from "@/hooks/useHandTrackingSnapshot";
import type { HandTrackingStatus } from "@/types/handTracking";

const STATUS_LABELS: Record<HandTrackingStatus, string> = {
  idle: "Idle",
  requesting_camera: "Requesting camera",
  starting_camera: "Starting camera",
  connecting_server: "Connecting server",
  connecting: "Connecting",
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Error",
};

export function HandTrackingOverlay(): React.JSX.Element | null {
  const { hands, status, serverStatus, error } = useHandTrackingSnapshot();

  if (status === "idle") {
    return null;
  }

  const pinching = hands.some((hand) => hand.isPinch);

  return (
    <aside className="hand-tracking-overlay" aria-label="Hand tracking status">
      <strong>Hand tracking</strong>
      <span>Status: {STATUS_LABELS[status]}</span>
      {serverStatus ? <span>Server: {serverStatus}</span> : null}
      <span>Hands: {hands.length}</span>
      <span>Pinch: {pinching ? "yes" : "no"}</span>
      {error ? (
        <span className="hand-tracking-overlay__error">{error}</span>
      ) : null}
    </aside>
  );
}
