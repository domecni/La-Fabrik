import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";

interface UseBothFistsHoldOptions {
  enabled: boolean;
  holdSeconds: number;
  onComplete: () => void;
}

export function useBothFistsHold({
  enabled,
  holdSeconds,
  onComplete,
}: UseBothFistsHoldOptions): void {
  const { hands } = useHandTrackingSnapshot();
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (enabled) return;

    elapsedRef.current = 0;
    completedRef.current = false;
  }, [enabled]);

  useFrame((_, delta) => {
    if (!enabled) return;
    if (completedRef.current) return;

    const fistCount = hands.filter((hand) => hand.isFist).length;
    if (fistCount < 2) {
      elapsedRef.current = 0;
      return;
    }

    elapsedRef.current += delta;
    if (elapsedRef.current < holdSeconds) return;

    completedRef.current = true;
    onCompleteRef.current();
  });
}
