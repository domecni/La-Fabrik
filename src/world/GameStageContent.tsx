import { RepairGame } from "@/components/three/gameplay/RepairGame";
import { Ebike } from "@/components/ebike/Ebike";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { RepairMissionId } from "@/types/gameplay/repairMission";
import type { Vector3Tuple } from "@/types/three/three";

interface StageAnchorProps {
  color: string;
  position: Vector3Tuple;
  scale?: number;
}

interface GameRepairZone {
  mission: RepairMissionId;
  position: Vector3Tuple;
}

const GAME_REPAIR_ZONES = [
  {
    mission: "bike",
    position: [8, 0, -6],
  },
  {
    mission: "pylone",
    position: [64, 0, -66],
  },
  {
    mission: "ferme",
    position: [-24, 0, 42],
  },
] as const satisfies readonly GameRepairZone[];

function StageAnchor({
  color,
  position,
  scale = 1,
}: StageAnchorProps): React.JSX.Element {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  );
}

export function GameStageContent(): React.JSX.Element {
  const mainState = useGameStore((state) => state.mainState);

  return (
    <>
      {mainState === "intro" ? (
        <StageAnchor color="#7dd3fc" position={[0, 4, 0]} />
      ) : null}
      <Ebike position={[0, 5, 0]} />
      {GAME_REPAIR_ZONES.map((zone) => (
        <RepairGame
          key={zone.mission}
          mission={zone.mission}
          position={zone.position}
        />
      ))}
      {mainState === "outro" ? (
        <StageAnchor color="#fb7185" position={[0, 6, 10]} scale={1.25} />
      ) : null}
    </>
  );
}
