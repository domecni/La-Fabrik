import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSubtitleStore } from "@/managers/stores/useSubtitleStore";

const TALKIE_MODEL_PATH = "/models/talkie/model.gltf";
const TALKIE_REVEAL_STEPS = new Set([
  "reveal",
  "await-ebike-mount",
  "ebike-intro-ride",
  "ebike-breakdown",
  "completed",
]);

const TALKIE_REST_Y = -0.55;
const TALKIE_ACTIVE_Y = -0.18;
const TALKIE_FLOAT_Y_AMPLITUDE = 0.025;
const TALKIE_FLOAT_ROTATION_AMPLITUDE = THREE.MathUtils.degToRad(1.6);

interface TalkieModelProps {
  active: boolean;
}

function TalkieModel({ active }: TalkieModelProps): React.JSX.Element {
  const { scene } = useGLTF(TALKIE_MODEL_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.frustumCulled = false;
      }
    });
  }, [model]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = clock.getElapsedTime();
    const floatY = Math.sin(t * 1.4) * TALKIE_FLOAT_Y_AMPLITUDE;
    const targetY = (active ? TALKIE_ACTIVE_Y : TALKIE_REST_Y) + floatY;
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.14,
    );

    if (active) {
      groupRef.current.rotation.z = Math.sin(t * 22) * 0.025;
    } else {
      groupRef.current.rotation.z =
        Math.sin(t * 0.8) * TALKIE_FLOAT_ROTATION_AMPLITUDE;
    }
  });

  return (
    <group ref={groupRef} position={[0, TALKIE_REST_Y, 0]}>
      <primitive
        object={model}
        rotation={[0.18, Math.PI, -0.08]}
        scale={1.45}
      />
    </group>
  );
}

function TalkieSignalLines(): React.JSX.Element {
  return (
    <svg
      className="talkie-dialogue-overlay__signals"
      viewBox="0 0 120 160"
      aria-hidden="true"
    >
      <path d="M34 20 C52 44 16 66 34 92 C48 112 22 128 30 146" />
      <path d="M68 12 C92 44 50 70 70 104 C84 130 48 142 52 154" />
      <path d="M100 8 C124 42 82 76 100 112 C112 136 74 150 78 158" />
    </svg>
  );
}

export function TalkieDialogueOverlay(): React.JSX.Element | null {
  const activeSubtitle = useSubtitleStore((state) => state.activeSubtitle);
  const mainState = useGameStore((state) => state.mainState);
  const introStep = useGameStore((state) => state.intro.currentStep);
  const isAfterReveal =
    mainState !== "intro" || TALKIE_REVEAL_STEPS.has(introStep);
  const isNarratorDialogue = activeSubtitle?.speaker === "Narrateur";

  if (!isAfterReveal) return null;

  const overlayClassName = isNarratorDialogue
    ? "talkie-dialogue-overlay talkie-dialogue-overlay--active talkie-dialogue-overlay--raised"
    : "talkie-dialogue-overlay";

  return (
    <aside className={overlayClassName} aria-hidden="true">
      {isNarratorDialogue ? <TalkieSignalLines /> : null}
      <div className="talkie-dialogue-overlay__model-frame">
        <Canvas
          camera={{ position: [0, 0, 4.2], zoom: 78 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          orthographic
        >
          <ambientLight intensity={2.5} />
          <directionalLight position={[2, 3, 4]} intensity={2.8} />
          <Suspense fallback={null}>
            <TalkieModel active={isNarratorDialogue} />
          </Suspense>
        </Canvas>
      </div>
    </aside>
  );
}

useGLTF.preload(TALKIE_MODEL_PATH);
