import { useEffect, useRef, useState } from "react";
import {
  HAND_TRACKING_FRAME_HEIGHT,
  HAND_TRACKING_FRAME_WIDTH,
  HAND_TRACKING_JPEG_QUALITY,
  HAND_TRACKING_RESPONSE_TIMEOUT_MS,
  HAND_TRACKING_RUNTIME_START_DELAY_MS,
  HAND_TRACKING_TARGET_FPS,
} from "@/data/handTrackingConfig";
import { getHandTrackingWsUrl } from "@/utils/handTracking/handTrackingEndpoint";
import {
  INITIAL_HAND_TRACKING_SNAPSHOT,
  getCameraStreamWithTimeout,
} from "@/lib/handTracking/handTrackingSession";
import type {
  HandTrackingFrameMessage,
  HandTrackingHand,
  HandTrackingServerMessage,
  HandTrackingSnapshot,
} from "@/types/handTracking/handTracking";
import { logger } from "@/utils/core/Logger";

interface UseRemoteHandTrackingOptions {
  enabled: boolean;
  websocketUrl?: string;
}

function getBase64Payload(dataUrl: string): string {
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isHandTrackingLandmark(value: unknown): boolean {
  return (
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.z)
  );
}

function isHandTrackingHand(value: unknown): value is HandTrackingHand {
  return (
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.z) &&
    Array.isArray(value.landmarks) &&
    value.landmarks.every(isHandTrackingLandmark) &&
    typeof value.handedness === "string" &&
    typeof value.isFist === "boolean" &&
    isFiniteNumber(value.score)
  );
}

function isHandTrackingServerMessage(
  value: unknown,
): value is HandTrackingServerMessage {
  if (!isRecord(value) || !isFiniteNumber(value.timestamp)) return false;

  if (value.type === "hands") {
    return Array.isArray(value.hands) && value.hands.every(isHandTrackingHand);
  }

  if (value.type === "status") {
    return typeof value.status === "string";
  }

  return (
    value.type === "error" &&
    Array.isArray(value.hands) &&
    value.hands.every(isHandTrackingHand) &&
    typeof value.message === "string"
  );
}

export function useRemoteHandTracking({
  enabled,
  websocketUrl = getHandTrackingWsUrl(),
}: UseRemoteHandTrackingOptions): HandTrackingSnapshot {
  const [snapshot, setSnapshot] = useState<HandTrackingSnapshot>(
    INITIAL_HAND_TRACKING_SNAPSHOT,
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sendIntervalRef = useRef<number | null>(null);
  const responseTimeoutRef = useRef<number | null>(null);
  const waitingForResponseRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    let cleanedUp = false;

    const clearResponseTimeout = (): void => {
      if (responseTimeoutRef.current === null) return;
      window.clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    };

    const cleanup = (): void => {
      if (cleanedUp) return;
      cleanedUp = true;

      if (sendIntervalRef.current !== null) {
        window.clearInterval(sendIntervalRef.current);
        sendIntervalRef.current = null;
      }

      clearResponseTimeout();
      waitingForResponseRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      videoRef.current = null;
      canvasRef.current = null;
    };

    const markResponseReceived = (): void => {
      waitingForResponseRef.current = false;
      clearResponseTimeout();
    };

    const markInvalidResponse = (): void => {
      setSnapshot((current) => ({
        ...current,
        hands: [],
        status: "error",
        usageStatus: "inactive",
        error: "Invalid hand tracking response",
      }));
    };

    const sendFrame = (): void => {
      const ws = wsRef.current;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");

      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (!video || !canvas || !context) return;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      if (waitingForResponseRef.current) return;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL(
        "image/jpeg",
        HAND_TRACKING_JPEG_QUALITY,
      );
      const message: HandTrackingFrameMessage = {
        type: "frame",
        timestamp: Date.now(),
        width: canvas.width,
        height: canvas.height,
        image: getBase64Payload(dataUrl),
      };

      waitingForResponseRef.current = true;
      ws.send(JSON.stringify(message));
      responseTimeoutRef.current = window.setTimeout(() => {
        waitingForResponseRef.current = false;
        responseTimeoutRef.current = null;
      }, HAND_TRACKING_RESPONSE_TIMEOUT_MS);
    };

    const start = async (): Promise<void> => {
      await Promise.resolve();
      if (cancelled) return;

      setSnapshot({
        hands: [],
        status: "requesting_camera",
        usageStatus: "available",
        serverStatus: null,
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
          status: "connecting_server",
        }));

        const canvas = document.createElement("canvas");
        canvas.width = HAND_TRACKING_FRAME_WIDTH;
        canvas.height = HAND_TRACKING_FRAME_HEIGHT;

        const ws = new WebSocket(websocketUrl);
        ws.onopen = () => {
          setSnapshot((current) => ({
            ...current,
            status: "connected",
            usageStatus: "available",
            error: null,
          }));
        };
        ws.onmessage = (event) => {
          markResponseReceived();
          if (typeof event.data !== "string") {
            markInvalidResponse();
            return;
          }

          let data: unknown;
          try {
            data = JSON.parse(event.data);
          } catch {
            markInvalidResponse();
            return;
          }

          if (!isHandTrackingServerMessage(data)) {
            markInvalidResponse();
            return;
          }

          if (data.type === "hands") {
            setSnapshot((current) => ({
              ...current,
              hands: data.hands,
              usageStatus: data.hands.some((hand) => hand.isFist)
                ? "active"
                : "available",
              serverStatus: null,
              error: null,
            }));
            return;
          }

          if (data.type === "status") {
            setSnapshot((current) => ({
              ...current,
              serverStatus: data.status,
            }));
            return;
          }

          setSnapshot((current) => ({
            ...current,
            hands: [],
            status: "error",
            usageStatus: "inactive",
            error: data.message,
          }));
        };
        ws.onerror = () => {
          markResponseReceived();
          logger.error("HandTracking", "Backend WebSocket error", {
            websocketUrl,
          });
          setSnapshot((current) => ({
            ...current,
            status: "error",
            error: "Hand tracking WebSocket error",
          }));
        };
        ws.onclose = () => {
          markResponseReceived();
          setSnapshot((current) => ({
            ...current,
            status: cancelled ? "idle" : "disconnected",
          }));
        };

        streamRef.current = stream;
        videoRef.current = video;
        canvasRef.current = canvas;
        wsRef.current = ws;
        sendIntervalRef.current = window.setInterval(
          sendFrame,
          1_000 / HAND_TRACKING_TARGET_FPS,
        );
      } catch (error) {
        if (cancelled) return;
        logger.error("HandTracking", "Backend runtime failed", {
          error: error instanceof Error ? error.message : String(error),
          websocketUrl,
        });
        setSnapshot({
          hands: [],
          status: "error",
          usageStatus: "inactive",
          serverStatus: null,
          error:
            error instanceof Error ? error.message : "Hand tracking failed",
        });
      }
    };

    // Delay the actual start so that a StrictMode mount/unmount/mount
    // cycle, or a rapid `enabled` toggle at a trigger border, does not
    // open the camera + WebSocket twice in a few milliseconds.
    const startTimer = window.setTimeout(() => {
      if (cancelled) return;
      void start();
    }, HAND_TRACKING_RUNTIME_START_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      cleanup();
    };
  }, [enabled, websocketUrl]);

  return snapshot;
}
