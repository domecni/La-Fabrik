import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import {
  useHandTrackingGloveStatus,
  type HandTrackingGloveHandedness,
} from "@/hooks/handTracking/useHandTrackingGloveStatus";

// Simple schematic silhouettes used as a last-resort fallback when the
// rigged glove model has failed to load. Both icons share the same
// 48x48 viewBox and the same stroke/fill rules from the .css.

const OpenHandShape = (): React.JSX.Element => (
  <>
    <ellipse cx="9" cy="30" rx="3" ry="6" transform="rotate(-25 9 30)" />
    <rect x="14" y="8" width="4" height="22" rx="2" />
    <rect x="20" y="4" width="4" height="26" rx="2" />
    <rect x="26" y="6" width="4" height="24" rx="2" />
    <rect x="32" y="10" width="4" height="20" rx="2" />
    <rect x="10" y="26" width="28" height="18" rx="6" />
  </>
);

const FistShape = (): React.JSX.Element => (
  <>
    <ellipse cx="8" cy="26" rx="3" ry="5" />
    <rect x="10" y="14" width="28" height="30" rx="10" />
    <circle cx="15" cy="14" r="3" />
    <circle cx="21" cy="13" r="3" />
    <circle cx="27" cy="13" r="3" />
    <circle cx="33" cy="14" r="3" />
  </>
);

function getHandedness(raw: string): HandTrackingGloveHandedness | null {
  const lower = raw.toLowerCase();
  if (lower === "left" || lower === "right") return lower;
  return null;
}

export function HandTrackingFallback(): React.JSX.Element | null {
  const { hands } = useHandTrackingSnapshot();
  const gloveStatus = useHandTrackingGloveStatus((state) => state.gloves);

  const visibleHands = hands.flatMap((hand, index) => {
    const handedness = getHandedness(hand.handedness);
    if (!handedness) return [];
    if (gloveStatus[handedness] !== "error") return [];

    const wrist = hand.landmarks[0];
    if (!wrist) return [];

    return [{ hand, handedness, wrist, index }];
  });

  if (visibleHands.length === 0) return null;

  return (
    <div className="hand-tracking-fallback" aria-hidden="true">
      {visibleHands.map(({ hand, handedness, wrist, index }) => {
        // MediaPipe coords are mirrored (selfie cam), keep the same
        // mapping the SVG visualizer uses.
        const leftPercent = (1 - wrist.x) * 100;
        const topPercent = wrist.y * 100;
        const flipX = handedness === "right" ? -1 : 1;

        return (
          <svg
            key={`${handedness}-${index}`}
            className="hand-tracking-fallback__icon"
            viewBox="0 0 48 48"
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              transform: `translate(-50%, -50%) scaleX(${flipX})`,
            }}
          >
            {hand.isFist ? <FistShape /> : <OpenHandShape />}
          </svg>
        );
      })}
    </div>
  );
}
