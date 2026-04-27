import { useHandTrackingSnapshot } from "@/hooks/useHandTrackingSnapshot";

export function HandTrackingOverlay(): React.JSX.Element | null {
  const { hands, status, serverStatus, error } = useHandTrackingSnapshot();

  if (status === "idle") {
    return null;
  }

  const pinching = hands.some((hand) => hand.isPinch);

  return (
    <aside className="hand-tracking-overlay" aria-label="Hand tracking status">
      <strong>Hand tracking</strong>
      <span>Status: {status}</span>
      {serverStatus ? <span>Server: {serverStatus}</span> : null}
      <span>Hands: {hands.length}</span>
      <span>Pinch: {pinching ? "yes" : "no"}</span>
      {error ? (
        <span className="hand-tracking-overlay__error">{error}</span>
      ) : null}
    </aside>
  );
}
