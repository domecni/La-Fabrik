import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_LOADING_DURATION_MS = 900;

export function useTransientLoadingIndicator(): {
  showLoading: (durationMs?: number) => void;
  visible: boolean;
} {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const showLoading = useCallback(
    (durationMs = DEFAULT_LOADING_DURATION_MS) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      setVisible(true);
      timeoutRef.current = window.setTimeout(() => {
        setVisible(false);
        timeoutRef.current = null;
      }, durationMs);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { showLoading, visible };
}
