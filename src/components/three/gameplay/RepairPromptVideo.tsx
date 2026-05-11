import { WorldVideoPrompt } from "@/components/three/ui/WorldVideoPrompt";
import type { Vector3Tuple } from "@/types/three/three";

interface RepairPromptVideoProps {
  src: string;
  position?: Vector3Tuple;
  size?: number;
  billboard?: boolean;
}

export function RepairPromptVideo({
  src,
  position = [0, 1.8, 0],
  size = 96,
  billboard = true,
}: RepairPromptVideoProps): React.JSX.Element {
  return (
    <WorldVideoPrompt
      billboard={billboard}
      position={position}
      size={size}
      src={src}
    />
  );
}
