import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { useRepairFocusStore } from "@/managers/stores/useRepairFocusStore";

const BUBBLE_RADIUS_METERS = 10;
const BUBBLE_GROW_DURATION_SECONDS = 2.5;
const BUBBLE_SHRINK_DURATION_SECONDS = 1.2;
const BUBBLE_COLOR = "#060814";
const BUBBLE_OPACITY = 0.92;
const BUBBLE_SHELL_RADIUS = 1; // sphere geometry baked at radius=1, scale = radius

/**
 * Dark sphere shroud rendered around the active repair model when the
 * focus state is active. Grows from 0 -> BUBBLE_RADIUS_METERS using a
 * GSAP `expo.out` ease so the player visually transitions from the open
 * map to an isolated repair "cocoon". Reverses on focus end.
 *
 * The sphere uses BackSide rendering so the player remains inside the
 * shroud when they stand near the repair model. A subtle decor pass
 * (grid floor + soft directional light + light fog) is rendered as a
 * sibling group so it appears once the bubble has expanded.
 */
export function RepairFocusBubble(): React.JSX.Element | null {
  const active = useRepairFocusStore((state) => state.active);
  const center = useRepairFocusStore((state) => state.center);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const decorRef = useRef<THREE.Group>(null);
  const scaleRef = useRef({ value: 0.0001 });
  const decorOpacityRef = useRef({ value: 0 });

  const sphereGeometry = useMemo(
    () => new THREE.SphereGeometry(BUBBLE_SHELL_RADIUS, 48, 32),
    [],
  );
  const sphereMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: BUBBLE_COLOR,
        side: THREE.BackSide,
        transparent: true,
        opacity: BUBBLE_OPACITY,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      sphereGeometry.dispose();
      sphereMaterial.dispose();
    };
  }, [sphereGeometry, sphereMaterial]);

  useEffect(() => {
    const targetScale = active ? BUBBLE_RADIUS_METERS : 0.0001;
    const targetDecor = active ? 1 : 0;
    const duration = active
      ? BUBBLE_GROW_DURATION_SECONDS
      : BUBBLE_SHRINK_DURATION_SECONDS;

    const scaleTween = gsap.to(scaleRef.current, {
      value: targetScale,
      duration,
      ease: active ? "expo.out" : "expo.in",
      onUpdate: () => {
        const mesh = meshRef.current;
        if (mesh) mesh.scale.setScalar(scaleRef.current.value);
      },
    });

    const decorTween = gsap.to(decorOpacityRef.current, {
      value: targetDecor,
      duration: duration * 0.8,
      delay: active ? duration * 0.4 : 0,
      ease: "power2.inOut",
      onUpdate: () => {
        const decor = decorRef.current;
        if (!decor) return;
        decor.traverse((child) => {
          if (
            child instanceof THREE.Mesh &&
            child.material instanceof THREE.Material
          ) {
            const material = child.material as THREE.Material & {
              opacity?: number;
              transparent?: boolean;
            };
            if (typeof material.opacity === "number") {
              material.opacity = decorOpacityRef.current.value;
              material.transparent = true;
            }
          }
        });
      },
    });

    return () => {
      scaleTween.kill();
      decorTween.kill();
    };
  }, [active]);

  // Render even when inactive so the shrink tween can play out; visibility
  // is implicit via near-zero scale.
  return (
    <group ref={groupRef} position={center}>
      <mesh
        ref={meshRef}
        geometry={sphereGeometry}
        material={sphereMaterial}
        renderOrder={-1}
        frustumCulled={false}
      />
      <group ref={decorRef}>
        {/* Subtle grid floor visible only inside the bubble */}
        <gridHelper
          args={[BUBBLE_RADIUS_METERS * 1.6, 24, "#1f2937", "#111827"]}
          position={[0, -0.5, 0]}
        />
        {/* Soft directional light for the repair model */}
        <directionalLight
          position={[2, 4, 3]}
          intensity={0.6}
          color="#cbd5f5"
        />
        <ambientLight intensity={0.25} color="#1e293b" />
      </group>
    </group>
  );
}
