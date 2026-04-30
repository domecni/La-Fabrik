import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import type { HandTrackingStatus } from "@/types/handTracking/handTracking";

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
  const { hands, status, usageStatus, serverStatus, error } =
    useHandTrackingSnapshot();

  if (status === "idle") {
    return null;
  }

  const fist = hands.some((hand) => hand.isFist);

  return (
    <aside className="hand-tracking-overlay" aria-label="Hand tracking status">
      <strong>Hand tracking</strong>
      <span>Status: {STATUS_LABELS[status]}</span>
      <span>Usage: {usageStatus}</span>
      {serverStatus ? <span>Server: {serverStatus}</span> : null}
      <span>Hands: {hands.length}</span>
      <span>Fist: {fist ? "yes" : "no"}</span>
      {error ? (
        <span className="hand-tracking-overlay__error">{error}</span>
      ) : null}
    </aside>
  );
}
