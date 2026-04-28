import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import type { AnimationAction } from "three";
import * as THREE from "three";
import type { Vector3Tuple } from "@/types/3d";

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

interface AnimatedModelContextValue {
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

export function useAnimatedModel(): AnimatedModelContextValue {
  const context = useContext(AnimatedModelContext);
  if (!context) {
    throw new Error("useAnimatedModel must be used within AnimatedModel");
  }
  return context;
}

interface AnimatedModelProps extends AnimatedModelConfig {
  children?: React.ReactNode;
}

export function AnimatedModel({
  modelPath,
  animations: _animations = [],
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
  const { scene, animations } = useGLTF(modelPath);
  const { actions, names, mixer } = useAnimations(animations, groupRef);
  const [currentAnim, setCurrentAnim] = useState(defaultAnimation);
  const [isReady, setIsReady] = useState(false);

  // DEBUG: Analyser la structure du modèle
  useEffect(() => {
    console.log("=== DEBUG ANIMATED MODEL ===");
    console.log("modelPath:", modelPath);
    console.log("scene:", scene);
    console.log("scene.children.length:", scene.children.length);
    console.log(
      "scene.children types:",
      scene.children.map((c) => c.type),
    );

    let foundMesh = false;
    let foundSkeleton = false;

    scene.traverse((child: THREE.Object3D) => {
      if (child.type === "SkinnedMesh") {
        console.log("✅ Found SkinnedMesh:", child.name);
        console.log("  visible:", child.visible);
        console.log("  skeleton:", (child as THREE.SkinnedMesh).skeleton);
        foundMesh = true;
      }
      if (child.type === "Mesh") {
        console.log("✅ Found Mesh:", child.name);
        console.log("  visible:", child.visible);
        foundMesh = true;
      }
      if (child.type === "Skeleton") {
        console.log("✅ Found Skeleton:", child);
        foundSkeleton = true;
      }
    });

    if (!foundMesh) console.log("❌ AUCUN MESH TROUVÉ!");
    if (!foundSkeleton) console.log("❌ AUCUN SKELETON TROUVÉ!");
    console.log("=========================");
  }, [scene, modelPath]);

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
    if (autoPlay && names.length > 0) {
      // Essayer d'abord l'animation par défaut, sinon la première disponible
      let defaultAction = actions[defaultAnimation as string];

      // Si l'animation par défaut n'existe pas, utiliser la première disponible
      if (!defaultAction && names.length > 0) {
        console.log(
          `Animation "${defaultAnimation}" non trouvée, utilisation de:`,
          names[0],
        );
        defaultAction = actions[names[0] as string];
      }

      if (defaultAction) {
        console.log("Lecture de l'animation:", defaultAction.getClip().name);
        defaultAction.play();
        setIsReady(true);
        setCurrentAnim(defaultAction.getClip().name);
        onLoaded?.();
      } else {
        console.log("Aucune animation disponible dans les actions");
      }
    } else if (names.length === 0) {
      console.log("Aucune animation trouvée dans le modèle");
    }
  }, [actions, defaultAnimation, names, autoPlay, onLoaded]);

  const parsedScale =
    typeof scale === "number" ? ([scale, scale, scale] as Vector3Tuple) : scale;

  const contextValue: AnimatedModelContextValue = {
    play,
    stop,
    fadeTo,
    currentAnimation: currentAnim,
    isReady,
    setSpeed,
    names,
  };

  return (
    <AnimatedModelContext.Provider value={contextValue}>
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={parsedScale}
      >
        <primitive object={scene.clone()} />
        {children}
      </group>
    </AnimatedModelContext.Provider>
  );
}
