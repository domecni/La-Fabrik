import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { useGameStore } from "@/managers/stores/useGameStore";
import type {
  CinematicDefinition,
  CinematicManifest,
} from "@/types/cinematics/cinematics";
import type { DialogueManifest } from "@/types/dialogues/dialogues";
import { logger } from "@/utils/core/logger";
import { loadCinematicManifest } from "@/utils/cinematics/loadCinematicManifest";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { queueDialogueById } from "@/utils/dialogues/playDialogue";

export function GameCinematics(): null {
  const camera = useThree((state) => state.camera);
  const [manifest, setManifest] = useState<CinematicManifest | null>(null);
  const [dialogueManifest, setDialogueManifest] =
    useState<DialogueManifest | null>(null);
  const playedCinematicsRef = useRef(new Set<string>());
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const activeAudiosRef = useRef(new Set<HTMLAudioElement>());

  useEffect(() => {
    let mounted = true;
    const activeAudios = activeAudiosRef.current;

    void loadCinematicManifest()
      .then((loadedManifest) => {
        if (mounted) setManifest(loadedManifest);
      })
      .catch((error: unknown) => {
        logger.error("GameCinematics", "Failed to load cinematic manifest", {
          error: error instanceof Error ? error : String(error),
        });
      });

    void loadDialogueManifest()
      .then((loadedManifest) => {
        if (mounted) setDialogueManifest(loadedManifest);
      })
      .catch((error: unknown) => {
        logger.error("GameCinematics", "Failed to load dialogue manifest", {
          error: error instanceof Error ? error : String(error),
        });
      });

    return () => {
      mounted = false;
      stopActiveCinematic(timelineRef);
      activeAudios.forEach((audio) => audio.pause());
      activeAudios.clear();
      useGameStore.getState().setCinematicPlaying(false);
    };
  }, []);

  useFrame(({ clock }) => {
    if (!manifest) return;

    const elapsedTime = clock.getElapsedTime();

    manifest.cinematics.forEach((cinematic) => {
      if (cinematic.timecode === undefined) return;
      if (cinematic.timecode > elapsedTime) return;
      if (cinematic.dialogueCues && !dialogueManifest) return;
      if (playedCinematicsRef.current.has(cinematic.id)) return;

      playedCinematicsRef.current.add(cinematic.id);
      playCinematic(camera, cinematic, timelineRef, {
        dialogueManifest,
        activeAudiosRef,
      });
    });
  });

  return null;
}

function stopActiveCinematic(
  timelineRef: MutableRefObject<gsap.core.Timeline | null>,
): void {
  timelineRef.current?.kill();
  timelineRef.current = null;
}

function playCinematic(
  camera: THREE.Camera,
  cinematic: CinematicDefinition,
  timelineRef: MutableRefObject<gsap.core.Timeline | null>,
  dialogueOptions: {
    dialogueManifest: DialogueManifest | null;
    activeAudiosRef: MutableRefObject<Set<HTMLAudioElement>>;
  },
): void {
  const firstKeyframe = cinematic.cameraKeyframes[0];
  if (!firstKeyframe) return;

  document.exitPointerLock();
  timelineRef.current?.kill();
  useGameStore.getState().setCinematicPlaying(true);

  const target = new THREE.Vector3(...firstKeyframe.target);
  camera.position.set(...firstKeyframe.position);
  camera.lookAt(target);

  const timeline = gsap.timeline({
    onUpdate: () => camera.lookAt(target),
    onComplete: () => {
      timelineRef.current = null;
      useGameStore.getState().setCinematicPlaying(false);
    },
  });

  cinematic.cameraKeyframes.slice(1).forEach((keyframe, index) => {
    const previousKeyframe = cinematic.cameraKeyframes[index];
    if (!previousKeyframe) return;

    const duration = keyframe.time - previousKeyframe.time;
    timeline.to(
      camera.position,
      {
        x: keyframe.position[0],
        y: keyframe.position[1],
        z: keyframe.position[2],
        duration,
        ease: "power2.inOut",
      },
      previousKeyframe.time,
    );
    timeline.to(
      target,
      {
        x: keyframe.target[0],
        y: keyframe.target[1],
        z: keyframe.target[2],
        duration,
        ease: "power2.inOut",
      },
      previousKeyframe.time,
    );
  });

  cinematic.dialogueCues?.forEach((cue) => {
    timeline.call(
      () => {
        if (!dialogueOptions.dialogueManifest) return;

        void queueDialogueById(
          dialogueOptions.dialogueManifest,
          cue.dialogueId,
        ).then((audio) => {
          if (!audio) return;

          dialogueOptions.activeAudiosRef.current.add(audio);
          audio.addEventListener(
            "ended",
            () => dialogueOptions.activeAudiosRef.current.delete(audio),
            { once: true },
          );
        });
      },
      undefined,
      cue.time,
    );
  });

  timelineRef.current = timeline;
}
