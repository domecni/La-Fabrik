import type {
  HandTrackingHand,
  HandTrackingLandmark,
} from "@/types/handTracking/handTracking";

function lerp(previous: number, next: number, factor: number): number {
  return previous * (1 - factor) + next * factor;
}

function smoothLandmark(
  previous: HandTrackingLandmark,
  next: HandTrackingLandmark,
  factor: number,
): HandTrackingLandmark {
  return {
    x: lerp(previous.x, next.x, factor),
    y: lerp(previous.y, next.y, factor),
    z: lerp(previous.z, next.z, factor),
  };
}

function smoothHand(
  previous: HandTrackingHand,
  next: HandTrackingHand,
  factor: number,
): HandTrackingHand {
  return {
    ...next,
    x: lerp(previous.x, next.x, factor),
    y: lerp(previous.y, next.y, factor),
    z: lerp(previous.z, next.z, factor),
    landmarks: next.landmarks.map((landmark, index) => {
      const previousLandmark = previous.landmarks[index];
      if (!previousLandmark) return landmark;
      return smoothLandmark(previousLandmark, landmark, factor);
    }),
  };
}

/**
 * Apply an exponential moving average to the landmark positions of each
 * detected hand. MediaPipe lands per-frame positions with noticeable
 * jitter (especially at ~10fps), and feeding those raw values into the
 * scene makes both the glove rig and any grabbed object tremble.
 *
 * `factor` is the weight given to the latest sample (0 = previous frame
 * only, 1 = no smoothing). Hands are matched between frames by
 * handedness so left/right don't bleed into each other.
 */
export function smoothHands(
  previousHands: HandTrackingHand[],
  nextHands: HandTrackingHand[],
  factor: number,
): HandTrackingHand[] {
  if (factor >= 1) return nextHands;

  return nextHands.map((next) => {
    const previous = previousHands.find(
      (candidate) => candidate.handedness === next.handedness,
    );
    if (!previous) return next;
    return smoothHand(previous, next, factor);
  });
}
