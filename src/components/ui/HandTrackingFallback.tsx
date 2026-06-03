import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import {
  useHandTrackingGloveStatus,
  type HandTrackingGloveHandedness,
} from "@/hooks/handTracking/useHandTrackingGloveStatus";

// Hand silhouettes used as a last-resort fallback when the rigged glove
// model has failed to load. Both icons share a 100x120 viewBox so finger
// lengths and the thumb angle stay anatomically readable.

const OpenHandShape = (): React.JSX.Element => (
  <path
    d="M 28 116
       Q 22 100 22 80
       Q 22 65 28 58
       Q 22 52 14 46
       Q 6 40 8 28
       Q 12 18 22 20
       Q 30 24 30 36
       Q 32 46 36 50
       Q 36 38 36 28
       Q 36 18 42 18
       Q 48 18 48 28
       Q 48 40 50 50
       Q 50 32 50 14
       Q 50 6 56 6
       Q 62 6 62 14
       Q 62 32 62 50
       Q 64 38 64 20
       Q 64 12 70 12
       Q 76 12 76 20
       Q 76 38 78 50
       Q 78 40 78 32
       Q 78 24 84 24
       Q 90 24 90 32
       Q 90 44 92 56
       Q 96 80 92 100
       Q 86 116 82 116
       Z"
  />
);

const FistShape = (): React.JSX.Element => (
  <>
    <path
      d="M 18 70
         Q 14 50 24 38
         Q 28 30 36 34
         Q 40 26 48 30
         Q 54 22 60 28
         Q 68 24 74 32
         Q 84 32 88 46
         Q 92 64 88 82
         Q 82 104 64 112
         Q 42 116 26 108
         Q 14 96 18 70
         Z"
    />
    <path
      d="M 18 70
         Q 6 66 8 80
         Q 8 94 18 96
         Q 28 94 26 84
         Q 22 76 18 70
         Z"
    />
    <path d="M 32 38 Q 30 50 34 60" fill="none" strokeLinecap="round" />
    <path d="M 46 32 Q 44 46 48 58" fill="none" strokeLinecap="round" />
    <path d="M 60 32 Q 58 46 62 58" fill="none" strokeLinecap="round" />
    <path d="M 74 36 Q 72 50 76 60" fill="none" strokeLinecap="round" />
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
            viewBox="0 0 100 120"
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
