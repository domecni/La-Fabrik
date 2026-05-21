import { EcoleModel } from "@/components/three/models/generated/EcoleModel";
import type { MapNode } from "@/types/editor/editor";

interface GeneratedMapNodeInstanceProps {
  node: MapNode;
  onLoaded: () => void;
}

export function GeneratedMapNodeInstance({
  node,
  onLoaded,
}: GeneratedMapNodeInstanceProps): React.JSX.Element | null {
  if (node.name === "ecole") {
    return (
      <EcoleModel
        position={node.position}
        rotation={node.rotation}
        scale={node.scale}
        onLoaded={onLoaded}
      />
    );
  }

  return null;
}
