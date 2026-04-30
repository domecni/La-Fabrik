import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import type { AnimationAction, AnimationMixer } from "three";
import * as THREE from "three";

export interface CharacterAnimationConfig {
  modelPath: string;
  initialAnimation?: string;
  fadeDuration?: number;
}

interface UseCharacterAnimationReturn {
  scene: THREE.Group;
  actions: { [key: string]: AnimationAction | null };
  names: string[];
  mixer: AnimationMixer;
  groupRef: React.MutableRefObject<THREE.Group | null>;
  currentAnimation: string;
  play: (name: string) => void;
  stop: () => void;
  fadeTo: (name: string, duration?: number) => void;
  setAnimationSpeed: (speed: number) => void;
}

const DEFAULT_FADE_DURATION = 0.3;

export function useCharacterAnimation(
  config: CharacterAnimationConfig,
): UseCharacterAnimationReturn {
  const {
    modelPath,
    initialAnimation = "Idle",
    fadeDuration = DEFAULT_FADE_DURATION,
  } = config;

  const groupRef = useRef<THREE.Group | null>(null);
  const { scene, animations } = useGLTF(modelPath);
  const model = useMemo(() => scene.clone(true), [scene]);
  const { actions, names, mixer } = useAnimations(animations, groupRef);
  const [currentAnimation, setCurrentAnimation] = useState(initialAnimation);

  const play = useCallback(
    (name: string) => {
      const action = actions[name];
      if (action) {
        Object.values(actions).forEach((a) => {
          if (a && a !== action) a.fadeOut(fadeDuration);
        });
        action.reset().fadeIn(fadeDuration).play();
        setCurrentAnimation(name);
      }
    },
    [actions, fadeDuration],
  );

  const stop = useCallback(() => {
    Object.values(actions).forEach((a) => a?.fadeOut(fadeDuration));
    const defaultAction = actions[initialAnimation as string];
    if (defaultAction) {
      defaultAction.reset().fadeIn(fadeDuration).play();
      setCurrentAnimation(initialAnimation);
    }
  }, [actions, initialAnimation, fadeDuration]);

  const fadeTo = useCallback(
    (name: string, duration = fadeDuration) => {
      const targetAction = actions[name];
      if (targetAction) {
        Object.values(actions).forEach((a) => {
          if (a && a !== targetAction) a.fadeOut(duration);
        });
        targetAction.reset().fadeIn(duration).play();
        setCurrentAnimation(name);
      }
    },
    [actions, fadeDuration],
  );

  const setAnimationSpeed = useCallback(
    (speed: number) => {
      Object.values(actions).forEach((action) => {
        action?.setEffectiveTimeScale(speed);
      });
    },
    [actions],
  );

  useEffect(() => {
    const defaultAction = actions[initialAnimation as string];
    if (defaultAction) {
      defaultAction.play();
    }
  }, [actions, initialAnimation]);

  return {
    scene: model,
    actions,
    names,
    mixer,
    groupRef,
    currentAnimation,
    play,
    stop,
    fadeTo,
    setAnimationSpeed,
  };
}
