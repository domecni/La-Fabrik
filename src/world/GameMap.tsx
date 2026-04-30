import type { ReactNode } from "react";
import { Component, useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useOctreeGraphNode } from "@/hooks/three/useOctreeGraphNode";
import { loadMapSceneData } from "@/utils/map/loadMapSceneData";
import type { MapNode } from "@/types/editor/editor";
import type { OctreeReadyHandler } from "@/types/three/three";

interface LoadedMapNode {
  node: MapNode;
  modelUrl: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.warn("Failed to load model", error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}

interface GameMapProps {
  onOctreeReady: OctreeReadyHandler;
}

export function GameMap({ onOctreeReady }: GameMapProps): React.JSX.Element {
  const [mapNodes, setMapNodes] = useState<LoadedMapNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const groupRef = useRef<THREE.Group>(null);

  useOctreeGraphNode(groupRef, onOctreeReady, mapNodes.length);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const sceneData = await loadMapSceneData();
        if (!sceneData) {
          console.warn("map.json not found");
          setIsLoading(false);
          return;
        }

        const loadedMapNodes = sceneData.mapNodes.flatMap((node) => {
          const modelUrl = sceneData.models.get(node.name);
          return modelUrl ? [{ node, modelUrl }] : [];
        });
        const missingModelCount =
          sceneData.mapNodes.length - loadedMapNodes.length;

        if (missingModelCount > 0) {
          console.warn(
            `${missingModelCount} map nodes were skipped because their model files are missing.`,
          );
        }

        setMapNodes(loadedMapNodes);
      } catch (error) {
        console.error("Error loading map:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, []);

  return (
    <group ref={groupRef}>
      {!isLoading &&
        mapNodes.map((mapNode, index) => (
          <ModelErrorBoundary key={index}>
            <ModelInstance node={mapNode.node} modelUrl={mapNode.modelUrl} />
          </ModelErrorBoundary>
        ))}
    </group>
  );
}

function ModelInstance({
  node,
  modelUrl,
}: {
  node: MapNode;
  modelUrl: string;
}): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelUrl);
  const sceneInstance = useMemo(() => scene.clone(true), [scene]);
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
      object={sceneInstance}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}
