import type { ReactNode } from "react";
import { Component } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useOctreeGraphNode } from "@/hooks/useOctreeGraphNode";
import { loadMapSceneData } from "@/utils/loadMapSceneData";
import type { OctreeReadyHandler } from "@/types/three";
import type { MapNode } from "@/types/editor";

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

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error): void {
    console.warn(`Failed to load model`);
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
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
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

        const loadedMapNodes = sceneData.mapNodes.filter((node) =>
          sceneData.models.has(node.name),
        );
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
        mapNodes.map((node, index) => (
          <ModelErrorBoundary key={index}>
            <ModelInstance node={node} />
          </ModelErrorBoundary>
        ))}
    </group>
  );
}

function ModelInstance({ node }: { node: MapNode }): React.JSX.Element | null {
  const modelPath = `/models/${node.name}/model.gltf`;

  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
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
