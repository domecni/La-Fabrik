import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAnimations } from "@react-three/drei";
import type { AnimationAction } from "three";
import * as THREE from "three";
import {
  AnimatedModelContext,
  type AnimatedModelContextValue,
} from "@/components/three/models/useAnimatedModel";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import type { ModelTransformProps, Vector3Tuple } from "@/types/three/three";

export interface AnimatedModelConfig extends ModelTransformProps {
  modelPath: string;
  animations?: string[];
  defaultAnimation?: string;
  fadeDuration?: number;
  speed?: number;
  autoPlay?: boolean;
  onLoaded?: () => void;
  onAnimationEnd?: (animationName: string) => void;
}

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
  const { scene, animations } = useLoggedGLTF(modelPath, {
    scope: "AnimatedModel",
    position,
    rotation,
    scale,
  });
  const model = useMemo(() => scene.clone(true), [scene]);
  const { actions, names, mixer } = useAnimations(animations, groupRef);

  const [currentAnim, setCurrentAnim] = useState(defaultAnimation);
  const isReady = names.length > 0;

  useEffect(() => {
    Object.values(actions).forEach((action) => {
      action?.setEffectiveTimeScale(speed);
    });
  }, [actions, speed]);

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
      Object.values(actions).forEach((action) => {
        action?.setEffectiveTimeScale(newSpeed);
      });
    },
    [actions],
  );

  useEffect(() => {
    if (!autoPlay || names.length === 0) {
      return;
    }

    let defaultAction = actions[defaultAnimation as string];

    if (!defaultAction && names.length > 0) {
      defaultAction = actions[names[0] as string];
    }

    if (defaultAction) {
      defaultAction.play();
      onLoaded?.();
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

  const parsedScale =
    typeof scale === "number" ? ([scale, scale, scale] as Vector3Tuple) : scale;

  return (
    <AnimatedModelContext.Provider value={contextValue}>
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={parsedScale}
      >
        <primitive object={model} />
      </group>
      {children}
    </AnimatedModelContext.Provider>
  );
}
