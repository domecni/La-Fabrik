import { useCallback, useEffect, useRef } from "react";
import { REPAIR_FRAGMENTATION_FIST_HOLD_SECONDS } from "@/data/gameplay/repairGameConfig";
import { INTERACT_KEY } from "@/data/input/keybindings";
import { useBothFistsHold } from "@/hooks/handTracking/useBothFistsHold";

interface UseRepairFragmentationInputOptions {
  enabled: boolean;
  onFragment: () => void;
}

export function useRepairFragmentationInput({
  enabled,
  onFragment,
}: UseRepairFragmentationInputOptions): void {
  const completedRef = useRef(false);

  useEffect(() => {
    if (enabled) return;

    completedRef.current = false;
  }, [enabled]);

  const fragment = useCallback(() => {
    if (!enabled) return;
    if (completedRef.current) return;

    completedRef.current = true;
    onFragment();
  }, [enabled, onFragment]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== INTERACT_KEY) return;

      event.preventDefault();
      fragment();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, fragment]);

  useBothFistsHold({
    enabled,
    holdSeconds: REPAIR_FRAGMENTATION_FIST_HOLD_SECONDS,
    onComplete: fragment,
  });
}
