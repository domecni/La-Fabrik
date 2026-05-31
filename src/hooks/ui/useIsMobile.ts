import { useSyncExternalStore } from "react";

const MOBILE_MEDIA_QUERY =
  "(max-width: 767px), (pointer: coarse) and (hover: none)";

function subscribeToMobileQuery(callback: () => void): () => void {
  const query = window.matchMedia(MOBILE_MEDIA_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getMobileSnapshot(): boolean {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getServerMobileSnapshot(): boolean {
  return false;
}

/**
 * True when the device is a phone or a touch-only tablet.
 * Uses matchMedia so layout decisions follow CSS conventions
 * and avoid resize-handler churn.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeToMobileQuery,
    getMobileSnapshot,
    getServerMobileSnapshot,
  );
}
