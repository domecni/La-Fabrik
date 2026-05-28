import { useCallback, useEffect, useState } from "react";
import { useAnimations } from "@react-three/drei";
import type { AnimationAction } from "three";
import {
  AnimatedModelContext,
  type AnimatedModelContextValue,
} from "@/hooks/animation/useAnimatedModel";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import type { ModelTransformProps } from "@/types/three/three";
import { logger } from "@/utils/core/Logger";

interface AnimatedModelConfig extends ModelTransformProps {
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
  const { scene, animations } = useLoggedGLTF(modelPath, {
    scope: "AnimatedModel",
    position,
    rotation,
    scale,
  });
  const { actions, names, mixer } = useAnimations(animations, scene);

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

    let defaultAction = actions[defaultAnimation];

    const fallbackAnimation = names[0];
    if (!defaultAction && fallbackAnimation) {
      logger.warn(
        "AnimatedModel",
        "Default animation missing, using fallback",
        {
          modelPath,
          defaultAnimation,
          fallbackAnimation,
          availableAnimations: names,
        },
      );
      defaultAction = actions[fallbackAnimation];
    }

    if (defaultAction) {
      defaultAction.play();
      onLoaded?.();
    }
  }, [actions, defaultAnimation, modelPath, names, autoPlay, onLoaded]);

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
    scene.rotation.set(rotation[0], rotation[1], rotation[2]);

    const parsedScale =
      typeof scale === "number" ? [scale, scale, scale] : (scale ?? [1, 1, 1]);
    scene.scale.set(
      parsedScale[0] ?? 1,
      parsedScale[1] ?? 1,
      parsedScale[2] ?? 1,
    );
  }, [scene, position, rotation, scale]);

  return (
    <AnimatedModelContext.Provider value={contextValue}>
      <primitive object={scene} />
      {children}
    </AnimatedModelContext.Provider>
  );
}
