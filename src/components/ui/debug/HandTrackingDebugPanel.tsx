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

export function HandTrackingDebugPanel(): React.JSX.Element | null {
  const { hands, status, usageStatus, serverStatus, error } =
    useHandTrackingSnapshot();

  if (status === "idle") {
    return null;
  }

  const fist = hands.some((hand) => hand.isFist);
  const hasLeftHand = hands.some(
    (hand) => hand.handedness.toLowerCase() === "left",
  );
  const hasRightHand = hands.some(
    (hand) => hand.handedness.toLowerCase() === "right",
  );
  const modelLoaded =
    [hasLeftHand ? "gant_l" : null, hasRightHand ? "gant_r" : null]
      .filter(Boolean)
      .join(", ") || "none";

  return (
    <section
      className="hand-tracking-debug-panel debug-overlay-section"
      aria-label="Hand tracking status"
    >
      <div className="debug-overlay-section__heading">
        <h3>Hand tracking</h3>
        <span>{STATUS_LABELS[status]}</span>
      </div>

      <dl className="debug-overlay-metrics">
        <div>
          <dt>Usage</dt>
          <dd>{usageStatus}</dd>
        </div>
        <div>
          <dt>Model loaded</dt>
          <dd>{modelLoaded}</dd>
        </div>
        {serverStatus ? (
          <div>
            <dt>Server</dt>
            <dd>{serverStatus}</dd>
          </div>
        ) : null}
        <div>
          <dt>Hands</dt>
          <dd>{hands.length}</dd>
        </div>
        <div>
          <dt>Fist</dt>
          <dd>{fist ? "yes" : "no"}</dd>
        </div>
      </dl>

      {error ? (
        <span className="hand-tracking-debug-panel__error">{error}</span>
      ) : null}
    </section>
  );
}
