import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { assetUrl } from "@/utils/assetUrl";

const SPEEDOMETER_DIAL_TEXTURE = assetUrl("/assets/world/gps/cadran.png");
const SPEEDOMETER_NEEDLE_TEXTURE = assetUrl("/assets/world/gps/fleche.png");
const SPEEDOMETER_MIN_ANGLE = Math.PI / 2;
const SPEEDOMETER_MAX_ANGLE = -Math.PI / 2;
const SPEEDOMETER_RENDER_ORDER = 10_000;

interface EbikeSpeedometerProps {
  width?: number;
  height?: number;
}

export function EbikeSpeedometer({
  width = 0.9,
  height = 0.5,
}: EbikeSpeedometerProps): React.JSX.Element {
  const needleGroupRef = useRef<THREE.Group>(null);
  const speedFactorRef = useRef(0);
  const [dialTexture, needleTexture] = useTexture([
    SPEEDOMETER_DIAL_TEXTURE,
    SPEEDOMETER_NEEDLE_TEXTURE,
  ]) as [THREE.Texture, THREE.Texture];
  const needleWidth = width * 0.68;
  const needleHeight = needleWidth / 2;

  useEffect(() => {
    [dialTexture, needleTexture].forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
    });
  }, [dialTexture, needleTexture]);

  useFrame((_, delta) => {
    const targetSpeedFactor = THREE.MathUtils.clamp(
      window.ebikeSpeedFactor ?? 0,
      0,
      1,
    );
    speedFactorRef.current = THREE.MathUtils.lerp(
      speedFactorRef.current,
      targetSpeedFactor,
      Math.min(1, delta * 10),
    );

    if (needleGroupRef.current) {
      needleGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        SPEEDOMETER_MIN_ANGLE,
        SPEEDOMETER_MAX_ANGLE,
        speedFactorRef.current,
      );
    }
  });

  return (
    <group renderOrder={SPEEDOMETER_RENDER_ORDER}>
      <mesh renderOrder={SPEEDOMETER_RENDER_ORDER}>
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

      <group ref={needleGroupRef} position={[0, -height * 0.38, 0.002]}>
        <mesh
          position={[0, needleHeight / 2, 0]}
          renderOrder={SPEEDOMETER_RENDER_ORDER + 1}
        >
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
