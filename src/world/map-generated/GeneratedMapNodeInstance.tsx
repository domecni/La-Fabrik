import { EcoleModel } from "@/components/three/world/EcoleModel";
import { FermeVerticaleModel } from "@/components/three/world/FermeVerticaleModel";
import { GenerateurModel } from "@/components/three/world/GenerateurModel";
import { LaFabrikMapModel } from "@/components/three/world/LaFabrikMapModel";
import {
  normalizeMapScale,
  useTerrainSnappedPosition,
} from "@/hooks/three/useTerrainHeight";
import type { MapNode } from "@/types/map/mapScene";

interface GeneratedMapNodeInstanceProps {
  node: MapNode;
  onLoaded: () => void;
}

export function GeneratedMapNodeInstance({
  node,
  onLoaded,
}: GeneratedMapNodeInstanceProps): React.JSX.Element | null {
  const position = useTerrainSnappedPosition(node.position);
  const scale = normalizeMapScale(node.scale);

  if (node.name === "ecole") {
    return (
      <EcoleModel
        position={position}
        rotation={node.rotation}
        scale={scale}
        onLoaded={onLoaded}
      />
    );
  }

  if (node.name === "fermeverticale") {
    return (
      <FermeVerticaleModel
        position={position}
        rotation={node.rotation}
        scale={scale}
        onLoaded={onLoaded}
      />
    );
  }

  if (node.name === "generateur") {
    return (
      <GenerateurModel
        position={position}
        rotation={node.rotation}
        scale={scale}
        onLoaded={onLoaded}
      />
    );
  }

  if (node.name === "lafabrik") {
    return (
      <LaFabrikMapModel
        position={position}
        rotation={node.rotation}
        scale={scale}
        onLoaded={onLoaded}
      />
    );
  }

  return null;
}
