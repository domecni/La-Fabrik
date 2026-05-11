import { Html } from "@react-three/drei";
import type { Vector3Tuple } from "@/types/three/three";

interface WorldVideoPromptProps {
  src: string;
  position?: Vector3Tuple;
  size?: number;
  billboard?: boolean;
}

export function WorldVideoPrompt({
  src,
  position = [0, 0, 0],
  size = 96,
  billboard = true,
}: WorldVideoPromptProps): React.JSX.Element {
  return (
    <Html
      position={position}
      center
      transform
      sprite={billboard}
      occlude={false}
    >
      <video
        aria-hidden="true"
        autoPlay
        loop
        muted
        playsInline
        src={src}
        style={{
          display: "block",
          height: size,
          objectFit: "contain",
          pointerEvents: "none",
          width: size,
        }}
      />
    </Html>
  );
}
