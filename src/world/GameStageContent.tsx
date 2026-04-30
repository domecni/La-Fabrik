import { useGameStore } from "@/managers/stores/useGameStore";
import type { Vector3Tuple } from "@/types/three";

interface StageAnchorProps {
  color: string;
  position: Vector3Tuple;
  scale?: number;
}

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

  switch (mainState) {
    case "intro":
      return <StageAnchor color="#7dd3fc" position={[0, 4, 0]} />;
    case "bike":
      return <StageAnchor color="#facc15" position={[8, 3, -6]} />;
    case "pylone":
      return <StageAnchor color="#a78bfa" position={[64, 6, -66]} />;
    case "ferme":
      return <StageAnchor color="#86efac" position={[-24, 5, 42]} />;
    case "outro":
      return <StageAnchor color="#fb7185" position={[0, 6, 10]} scale={1.25} />;
  }
}
