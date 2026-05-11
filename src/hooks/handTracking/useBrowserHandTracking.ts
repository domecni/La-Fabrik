import { useEffect, useRef, useState } from "react";
import {
  HAND_TRACKING_FRAME_HEIGHT,
  HAND_TRACKING_FRAME_WIDTH,
  HAND_TRACKING_TARGET_FPS,
} from "@/data/handTrackingConfig";
import {
  convertBrowserHandResult,
  getBrowserHandLandmarker,
} from "@/lib/handTracking/browserHandTracking";
import {
  INITIAL_HAND_TRACKING_SNAPSHOT,
  getCameraStreamWithTimeout,
} from "@/lib/handTracking/handTrackingSession";
import type { HandTrackingSnapshot } from "@/types/handTracking/handTracking";

interface UseBrowserHandTrackingOptions {
  enabled: boolean;
}

export function useBrowserHandTracking({
  enabled,
}: UseBrowserHandTrackingOptions): HandTrackingSnapshot {
  const [snapshot, setSnapshot] = useState<HandTrackingSnapshot>(
    INITIAL_HAND_TRACKING_SNAPSHOT,
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    const cleanup = (): void => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      videoRef.current = null;
    };

    const start = async (): Promise<void> => {
      setSnapshot({
        hands: [],
        status: "requesting_camera",
        usageStatus: "available",
        serverStatus: "Browser JS",
        error: null,
      });

      try {
        const stream = await getCameraStreamWithTimeout({
          video: {
            width: HAND_TRACKING_FRAME_WIDTH,
            height: HAND_TRACKING_FRAME_HEIGHT,
            facingMode: "user",
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setSnapshot((current) => ({
          ...current,
          status: "starting_camera",
        }));

        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        await video.play();

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setSnapshot((current) => ({
          ...current,
          status: "connecting",
          serverStatus: "Loading Browser JS model",
        }));

        const handLandmarker = await getBrowserHandLandmarker();

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current = video;

        setSnapshot((current) => ({
          ...current,
          status: "connected",
          serverStatus: "Browser JS",
        }));

        intervalRef.current = window.setInterval(() => {
          if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

          const result = handLandmarker.detectForVideo(
            video,
            performance.now(),
          );
          const hands = convertBrowserHandResult(result);

          setSnapshot((current) => ({
            ...current,
            hands,
            usageStatus: hands.some((hand) => hand.isFist)
              ? "active"
              : "available",
            error: null,
          }));
        }, 1_000 / HAND_TRACKING_TARGET_FPS);
      } catch (error) {
        if (cancelled) return;

        setSnapshot({
          hands: [],
          status: "error",
          usageStatus: "inactive",
          serverStatus: "Browser JS",
          error:
            error instanceof Error
              ? error.message
              : "Browser hand tracking failed",
        });
      }
    };

    void start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled]);

  return snapshot;
}
