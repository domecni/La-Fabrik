/* eslint-disable react-hooks/immutability */
import { createContext, useRef, useState, useEffect, useCallback } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import type { AnimationAction } from "three";
import * as THREE from "three";
import type { Vector3Tuple } from "@/types/three";

export interface AnimatedModelConfig {
  modelPath: string;
  animations?: string[];
  defaultAnimation?: string;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple | number;
  fadeDuration?: number;
  speed?: number;
  autoPlay?: boolean;
  onLoaded?: () => void;
  onAnimationEnd?: (animationName: string) => void;
}

export interface AnimatedModelContextValue {
  play: (name: string, fade?: number) => void;
  stop: (fade?: number) => void;
  fadeTo: (name: string, fade?: number) => void;
  currentAnimation: string;
  isReady: boolean;
  setSpeed: (speed: number) => void;
  names: string[];
}

const AnimatedModelContext = createContext<AnimatedModelContextValue | null>(
  null,
);

export { AnimatedModelContext };

interface AnimatedModelProps extends AnimatedModelConfig {
  children?: React.ReactNode;
}

export function AnimatedModel({
  modelPath,
  defaultAnimation = "Idle",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  fadeDuration = 0.3,
  speed = 1,
  autoPlay = true,
  onLoaded,
  onAnimationEnd,
  children,
}: AnimatedModelProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);

  void groupRef;
  const { scene, animations } = useGLTF(modelPath);
  const { actions, names, mixer } = useAnimations(animations, scene);

  const [currentAnim, setCurrentAnim] = useState(defaultAnimation);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (mixer) {
      mixer.timeScale = speed;
    }
  }, [mixer, speed]);

  useEffect(() => {
    const handleFinished = (e: { action: AnimationAction }) => {
      const clipName = e.action.getClip().name;
      onAnimationEnd?.(clipName);
    };

    if (mixer) {
      mixer.addEventListener("finished", handleFinished);
      return () => {
        mixer.removeEventListener("finished", handleFinished);
      };
    }
  }, [mixer, onAnimationEnd]);

  const play = useCallback(
    (name: string, fade = fadeDuration) => {
      const action = actions[name];
      if (action) {
        Object.values(actions).forEach((a) => {
          if (a && a !== action) a.fadeOut(fade);
        });
        action.reset().fadeIn(fade).play();
        setCurrentAnim(name);
      }
    },
    [actions, fadeDuration],
  );

  const stop = useCallback(
    (fade = fadeDuration) => {
      Object.values(actions).forEach((a) => a?.fadeOut(fade));
      const defaultAction = actions[defaultAnimation];
      if (defaultAction) {
        defaultAction.reset().fadeIn(fade).play();
        setCurrentAnim(defaultAnimation);
      }
    },
    [actions, defaultAnimation, fadeDuration],
  );

  const fadeTo = useCallback(
    (name: string, fade = fadeDuration) => {
      const action = actions[name];
      if (action) {
        Object.values(actions).forEach((a) => {
          if (a && a !== action) a.fadeOut(fade);
        });
        action.reset().fadeIn(fade).play();
        setCurrentAnim(name);
      }
    },
    [actions, fadeDuration],
  );

  const setSpeed = useCallback(
    (newSpeed: number) => {
      if (mixer) {
        mixer.timeScale = newSpeed;
      }
    },
    [mixer],
  );

  useEffect(() => {
    if (!autoPlay || names.length === 0) {
      console.log("[AnimatedModel] No animation found in model");
      return;
    }

    console.log(`[AnimatedModel] Available animations: ${names.join(", ")}`);

    let defaultAction = actions[defaultAnimation as string];

    if (!defaultAction && names.length > 0) {
      console.log(
        `[AnimatedModel] "${defaultAnimation}" not found, using: ${names[0]}`,
      );
      defaultAction = actions[names[0] as string];
    }

    if (defaultAction) {
      defaultAction.play();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsReady(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentAnim(defaultAction.getClip().name);
      onLoaded?.();
    } else {
      console.log("[AnimatedModel] No available animation in actions");
    }
  }, [actions, defaultAnimation, names, autoPlay, onLoaded]);

  const contextValue: AnimatedModelContextValue = {
    play,
    stop,
    fadeTo,
    currentAnimation: currentAnim,
    isReady,
    setSpeed,
    names,
  };

  useEffect(() => {
    scene.position.set(...position);
    scene.rotation.set(
      (rotation[0] * Math.PI) / 180,
      (rotation[1] * Math.PI) / 180,
      (rotation[2] * Math.PI) / 180,
    );
    const s =
      typeof scale === "number" ? [scale, scale, scale] : (scale ?? [1, 1, 1]);
    scene.scale.set(s[0] ?? 1, s[1] ?? 1, s[2] ?? 1);
  }, [scene, position, rotation, scale]);

  return (
    <AnimatedModelContext.Provider value={contextValue}>
      <primitive object={scene} />
      {children}
    </AnimatedModelContext.Provider>
  );
}
