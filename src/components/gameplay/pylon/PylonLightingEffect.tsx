import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/managers/stores/useGameStore";
import { LIGHTING_STATE } from "@/world/lightingState";
import { LIGHTING_DEFAULTS } from "@/data/world/lightingConfig";

// ─── Pylon atmosphere colours ─────────────────────────────────────────────────
// Applied from "approaching" until the pylon mission ends.
const PYLON_AMBIENT_COLOR = "#7b87c8"; // blue-violet
const PYLON_SUN_COLOR = "#a882d4"; // lavender-purple

// Lerp speed (1 = full transition in ~1 s at 60 fps)
const TRANSITION_SPEED = 0.8;

// ─────────────────────────────────────────────────────────────────────────────

export function PylonLightingEffect(): null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.pylon.currentStep);

  // True from "approaching" until narrator-outro (lighting resets before the outro audio)
  const isActive = mainState === "pylon" && step !== "locked" && step !== "narrator-outro";

  // Working THREE.Color instances — lerped every frame
  const ambientRef = useRef(new THREE.Color(LIGHTING_STATE.ambientColor));
  const sunRef = useRef(new THREE.Color(LIGHTING_STATE.sunColor));

  // Target colours — updated reactively when isActive changes
  const targetAmbientRef = useRef(new THREE.Color(LIGHTING_DEFAULTS.ambientColor));
  const targetSunRef = useRef(new THREE.Color(LIGHTING_DEFAULTS.sunColor));

  useEffect(() => {
    if (isActive) {
      targetAmbientRef.current.set(PYLON_AMBIENT_COLOR);
      targetSunRef.current.set(PYLON_SUN_COLOR);
    } else {
      targetAmbientRef.current.set(LIGHTING_DEFAULTS.ambientColor);
      targetSunRef.current.set(LIGHTING_DEFAULTS.sunColor);
    }
  }, [isActive]);

  useFrame((_, delta) => {
    const t = Math.min(TRANSITION_SPEED * delta, 1);

    ambientRef.current.lerp(targetAmbientRef.current, t);
    sunRef.current.lerp(targetSunRef.current, t);

    LIGHTING_STATE.ambientColor = `#${ambientRef.current.getHexString()}`;
    LIGHTING_STATE.sunColor = `#${sunRef.current.getHexString()}`;
  });

  return null;
}
