import { useEffect, useRef, useState } from "react";
import {
  HAND_TRACKING_FRAME_HEIGHT,
  HAND_TRACKING_FRAME_WIDTH,
  HAND_TRACKING_JPEG_QUALITY,
  HAND_TRACKING_RESPONSE_TIMEOUT_MS,
  HAND_TRACKING_TARGET_FPS,
  getHandTrackingWsUrl,
} from "@/data/handTrackingConfig";
import type {
  HandTrackingFrameMessage,
  HandTrackingServerMessage,
  HandTrackingSnapshot,
} from "@/types/handTracking";

interface UseRemoteHandTrackingOptions {
  enabled: boolean;
  websocketUrl?: string;
}

const INITIAL_SNAPSHOT: HandTrackingSnapshot = {
  hands: [],
  status: "idle",
  serverStatus: null,
  error: null,
};

function getBase64Payload(dataUrl: string): string {
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

export function useRemoteHandTracking({
  enabled,
  websocketUrl = getHandTrackingWsUrl(),
}: UseRemoteHandTrackingOptions): HandTrackingSnapshot {
  const [snapshot, setSnapshot] =
    useState<HandTrackingSnapshot>(INITIAL_SNAPSHOT);
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

    const clearResponseTimeout = (): void => {
      if (responseTimeoutRef.current === null) return;
      window.clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    };

    const cleanup = (): void => {
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
        status: "connecting",
        serverStatus: null,
        error: null,
      });

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
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

        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement("canvas");
        canvas.width = HAND_TRACKING_FRAME_WIDTH;
        canvas.height = HAND_TRACKING_FRAME_HEIGHT;

        const ws = new WebSocket(websocketUrl);
        ws.onopen = () => {
          setSnapshot((current) => ({
            ...current,
            status: "connected",
            error: null,
          }));
        };
        ws.onmessage = (event) => {
          markResponseReceived();
          const data = JSON.parse(event.data) as HandTrackingServerMessage;

          if (data.type === "hands") {
            setSnapshot((current) => ({
              ...current,
              hands: data.hands,
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
            error: data.message,
          }));
        };
        ws.onerror = () => {
          markResponseReceived();
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
        setSnapshot({
          hands: [],
          status: "error",
          serverStatus: null,
          error:
            error instanceof Error ? error.message : "Hand tracking failed",
        });
      }
    };

    void start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, websocketUrl]);

  return snapshot;
}
