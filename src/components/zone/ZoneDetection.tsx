import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ZONES } from "@/data/zones";
import { useGameStore } from "@/managers/stores/useGameStore";
import { Debug } from "@/utils/debug/Debug";
import { GAME_STEPS } from "@/data/game/gameStateConfig";

const _playerPos = new THREE.Vector3();
const _zonePos = new THREE.Vector3();

export function ZoneDetection(): null {
  const camera = useThree((state) => state.camera);
  const triggeredZones = useRef<Set<string>>(new Set());
  const debug = Debug.getInstance();
  const step = useGameStore((state) => state.intro.currentStep);
  const setStep = useGameStore((state) => state.setIntroStep);

  useEffect(() => {
    if (!debug.active) return;

    const folder = debug.createFolder("Game");
    if (!folder) return;

    const gameState = { step: step };
    const playerPos = { x: 0, y: 0, z: 0 };

    folder.add(gameState, "step", GAME_STEPS).name("Game Step").disable();

    folder.add(playerPos, "x").name("Player X").listen().disable();
    folder.add(playerPos, "y").name("Player Y").listen().disable();
    folder.add(playerPos, "z").name("Player Z").listen().disable();

    const unsubStore = useGameStore.subscribe((state) => {
      gameState.step = state.intro.currentStep;
      folder.controllersRecursive().forEach((c) => c.updateDisplay());
    });

    let frameId: number;
    const updatePlayerPos = (): void => {
      camera.getWorldPosition(_playerPos);
      playerPos.x = Math.round(_playerPos.x * 100) / 100;
      playerPos.y = Math.round(_playerPos.y * 100) / 100;
      playerPos.z = Math.round(_playerPos.z * 100) / 100;
      folder.controllersRecursive().forEach((c) => c.updateDisplay());
      frameId = requestAnimationFrame(updatePlayerPos);
    };
    updatePlayerPos();

    return () => {
      cancelAnimationFrame(frameId);
      debug.destroyFolder("Game");
      unsubStore();
    };
  }, [debug, camera, step]);

  useFrame(() => {
    camera.getWorldPosition(_playerPos);

    for (const zone of ZONES) {
      if (triggeredZones.current.has(zone.id)) continue;

      _zonePos.set(...zone.position);

      const distanceSq = _playerPos.distanceToSquared(_zonePos);

      if (distanceSq <= zone.radius * zone.radius) {
        setStep(zone.targetStep);
        triggeredZones.current.add(zone.id);
        break;
      }
    }
  });

  return null;
}

export function ZoneDebugVisuals(): React.JSX.Element | null {
  const debug = Debug.getInstance();
  const camera = useThree((state) => state.camera);
  const [triggeredZones, setTriggeredZones] = useState<Set<string>>(new Set());

  useFrame(() => {
    camera.getWorldPosition(_playerPos);

    for (const zone of ZONES) {
      if (triggeredZones.has(zone.id)) continue;

      _zonePos.set(...zone.position);

      const distanceSq = _playerPos.distanceToSquared(_zonePos);

      if (distanceSq <= zone.radius * zone.radius) {
        setTriggeredZones((prev) => new Set(prev).add(zone.id));
        break;
      }
    }
  });

  if (!debug.active) return null;

  return (
    <>
      {ZONES.map((zone) => (
        <ZoneVisual
          key={zone.id}
          position={[zone.position[0], 0.1, zone.position[2]]}
          radius={zone.radius}
          height={zone.height}
          triggered={triggeredZones.has(zone.id)}
        />
      ))}
    </>
  );
}

function ZoneVisual({
  position,
  radius,
  height,
  triggered,
}: {
  position: [number, number, number];
  radius: number;
  height: number;
  triggered: boolean;
}): React.JSX.Element {
  const color = triggered ? "#00ff00" : "#ff0000";

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.3, radius, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 32, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
