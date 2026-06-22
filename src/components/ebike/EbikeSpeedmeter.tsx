import { useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Vector3Tuple } from "@/types/three/three";
import "@/types/ebike/ebikeWindow";
import { assetUrl } from "@/utils/assetUrl";

const SPEEDOMETER_DIAL_TEXTURE = assetUrl("/assets/world/gps/cadran.png");
const SPEEDOMETER_NEEDLE_TEXTURE = assetUrl("/assets/world/gps/fleche.png");

export interface EbikeSpeedmeterProps {
  width?: number;
  height?: number;
  /** Local position offset within the parent group. Default: [0, 0, 0] */
  position?: Vector3Tuple;
  /**
   * Needle rotation.z when speedFactor = 0.
   * Default: Math.PI / 2  (pointing left — 9 o'clock)
   */
  minAngle?: number;
  /**
   * Needle rotation.z when speedFactor = 1.
   * Default: -Math.PI / 2 (pointing right — 3 o'clock)
   */
  maxAngle?: number;
  renderOrder?: number;
  /**
   * Inner radius of the gauge-fill arc, as a fraction of the canvas half-width.
   * Tune this to align the fill with the cadran.png track.  Default: 0.33
   */
  gaugeInnerR?: number;
  /**
   * Outer radius of the gauge-fill arc, as a fraction of the canvas half-width.
   * Tune this to align the fill with the cadran.png track.  Default: 0.445
   */
  gaugeOuterR?: number;
  /**
   * Width of the gauge-fill plane. Defaults to `width` when omitted.
   * Lets you resize the fill independently of the cadran/needle.
   */
  gaugeWidth?: number;
  /**
   * Height of the gauge-fill plane. Defaults to `height` when omitted.
   * Lets you resize the fill independently of the cadran/needle.
   */
  gaugeHeight?: number;
  /**
   * Horizontal offset of the arc pivot from the canvas centre.
   * Expressed as a fraction of the canvas size: -0.1 = shift 10 % to the left,
   * +0.1 = shift 10 % to the right. Default: 0
   */
  gaugeOffsetX?: number;
  /**
   * Vertical offset of the arc pivot from its default position.
   * Expressed as a fraction of the canvas size: -0.1 = shift upward (toward top
   * of the plane), +0.1 = shift downward. Default: 0
   */
  gaugeOffsetY?: number;
}

// The needle pivot is always at -height*0.38 in local space,
// which is always 12 % from the bottom of the plane (UV y = 0.12).
// With Three.js flipY texture convention, canvas y = (1 - 0.12) * size = 0.88 * size.
const NEEDLE_PIVOT_UV_Y = 0.12; // fraction from bottom

export function EbikeSpeedmeter({
  width = 0.8,
  height = 0.8,
  position = [0, 0, 0],
  minAngle = Math.PI / 2,
  maxAngle = -Math.PI / 2,
  renderOrder = 1000,
  gaugeInnerR = 0.33,
  gaugeOuterR = 0.445,
  gaugeWidth,
  gaugeHeight,
  gaugeOffsetX = 0,
  gaugeOffsetY = 0,
}: EbikeSpeedmeterProps): React.JSX.Element {
  // Fall back to the main dimensions when gauge-specific ones aren't provided
  const fillW = gaugeWidth ?? width;
  const fillH = gaugeHeight ?? height;
  const needleGroupRef = useRef<THREE.Group>(null);
  const speedFactorRef = useRef(0);

  // ── Dial & needle textures ──────────────────────────────────────────────────
  const [dialTexture, needleTexture] = useTexture([
    SPEEDOMETER_DIAL_TEXTURE,
    SPEEDOMETER_NEEDLE_TEXTURE,
  ]) as [THREE.Texture, THREE.Texture];

  const needleWidth = width * 0.68;
  const needleHeight = needleWidth / 2;

  useEffect(() => {
    [dialTexture, needleTexture].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    });
  }, [dialTexture, needleTexture]);

  // ── Gauge-fill canvas ───────────────────────────────────────────────────────
  const fillCanvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    return c;
  }, []);

  const fillTexture = useMemo(() => {
    const tex = new THREE.CanvasTexture(fillCanvas);
    tex.format = THREE.RGBAFormat;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [fillCanvas]);

  useEffect(
    () => () => {
      fillTexture.dispose();
    },
    [fillTexture],
  );

  // ── Frame loop ──────────────────────────────────────────────────────────────
  /* External Three.js canvas+texture sync — intentional side effects in useFrame. */
  /* eslint-disable react-hooks/immutability */
  useFrame((_, delta) => {
    // 1. Smooth speed factor
    const target = THREE.MathUtils.clamp(window.ebikeSpeedFactor ?? 0, 0, 1);
    speedFactorRef.current = THREE.MathUtils.lerp(
      speedFactorRef.current,
      target,
      Math.min(1, delta * 10),
    );

    // 2. Needle rotation
    if (needleGroupRef.current) {
      needleGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        minAngle,
        maxAngle,
        speedFactorRef.current,
      );
    }

    // 3. Draw gauge fill -------------------------------------------------------
    const ctx = fillCanvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const size = fillCanvas.width;
    ctx.clearRect(0, 0, size, size);

    // Default centre: horizontal middle + needle-pivot height.
    // gaugeOffsetX/Y shift the pivot so the arc aligns with cadran.png.
    const cx = size * (0.5 + gaugeOffsetX);
    const cy = size * (1 - NEEDLE_PIVOT_UV_Y + gaugeOffsetY); // default ≈ 0.88 × size

    const outerR = size * gaugeOuterR;
    const innerR = size * gaugeInnerR;

    // Arc sweeps clockwise from π (left) to current needle angle
    const arcStart = Math.PI;
    const arcEnd = Math.PI + speedFactorRef.current * Math.PI;

    if (speedFactorRef.current > 0.005) {
      // Radial gradient using #3F67DD — slightly transparent at inner edge,
      // fully solid at outer edge for a depth effect.
      const radial = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      radial.addColorStop(0, "rgba(191, 234, 255, 0)"); // inner edge
      radial.addColorStop(0.7, "rgba(118, 152, 255, 0.95)"); // outer edge

      // Annular sector shape (outer arc + inner arc reversed)
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, arcStart, arcEnd, false);
      ctx.arc(cx, cy, innerR, arcEnd, arcStart, true);
      ctx.closePath();

      ctx.fillStyle = radial;
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#3F67DD";
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    fillTexture.needsUpdate = true;
    /* eslint-enable react-hooks/immutability */
  });

  return (
    <group renderOrder={renderOrder} position={position}>
      {/* Gauge fill — behind the cadran frame (size controlled by gaugeWidth/gaugeHeight) */}
      <mesh renderOrder={renderOrder - 1} position={[0, 0, -0.001]}>
        <planeGeometry args={[fillW, fillH]} />
        <meshBasicMaterial
          map={fillTexture}
          transparent
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dial frame (cadran.png) */}
      <mesh renderOrder={renderOrder}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={dialTexture}
          transparent
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Needle — pivot at bottom-centre of the arc */}
      <group
        ref={needleGroupRef}
        position={[0, -height * 0.38, 0.002]}
        rotation={[0, 0, 0]}
      >
        <mesh position={[0, needleHeight / 2, 0]} renderOrder={renderOrder + 1}>
          <planeGeometry args={[needleWidth, needleHeight]} />
          <meshBasicMaterial
            map={needleTexture}
            transparent
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
