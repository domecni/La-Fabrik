import { useEffect, useState, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useOctreeGraphNode } from "@/hooks/useOctreeGraphNode";
import { loadMapSceneData } from "@/utils/loadMapSceneData";
import type { OctreeReadyHandler } from "@/types/3d";
import type { MapNode } from "@/types/editor";

interface GameMapProps {
  onOctreeReady: OctreeReadyHandler;
}

export function GameMap({ onOctreeReady }: GameMapProps): React.JSX.Element {
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const groupRef = useRef<THREE.Group>(null);

  useOctreeGraphNode(groupRef, onOctreeReady);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const sceneData = await loadMapSceneData();
        if (!sceneData) {
          console.warn("map.json not found");
          setIsLoading(false);
          return;
        }

        setMapNodes(
          sceneData.mapNodes.filter((node) => sceneData.models.has(node.name)),
        );
      } catch (error) {
        console.error("Error loading map:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, []);

  if (isLoading) {
    return <></>;
  }

  return (
    <group ref={groupRef}>
      {mapNodes.map((node, index) => (
        <ModelInstance key={index} node={node} />
      ))}
    </group>
  );
}

function ModelInstance({ node }: { node: MapNode }): React.JSX.Element {
  const modelPath = `/models/${node.name}/model.gltf`;
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const { position, rotation, scale } = node;

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      groupRef.current.rotation.set(...rotation);
      groupRef.current.scale.set(...scale);
    }
  }, [position, rotation, scale]);

  return (
    <primitive
      ref={groupRef}
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}
