import type { ReactNode } from "react";
import { Component, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { useOctreeGraphNode } from "@/hooks/three/useOctreeGraphNode";
import { logger } from "@/utils/core/Logger";
import { loadMapSceneData } from "@/utils/map/loadMapSceneData";
import { logModelLoadError } from "@/utils/three/modelLoadLogger";
import type { MapNode } from "@/types/editor/editor";
import type { OctreeReadyHandler } from "@/types/three/three";

interface LoadedMapNode {
  node: MapNode;
  modelUrl: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  modelUrl: string;
  node: MapNode;
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
    logModelLoadError(
      {
        modelPath: this.props.modelUrl,
        scope: "GameMap.ModelInstance",
        position: this.props.node.position,
        rotation: this.props.node.rotation,
        scale: this.props.node.scale,
      },
      error,
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

interface GameMapProps {
  onOctreeReady: OctreeReadyHandler;
}

export function GameMap({ onOctreeReady }: GameMapProps): React.JSX.Element {
  const [mapNodes, setMapNodes] = useState<LoadedMapNode[]>([]);
  const groupRef = useRef<THREE.Group>(null);

  useOctreeGraphNode(groupRef, onOctreeReady, mapNodes.length);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const sceneData = await loadMapSceneData();
        if (!sceneData) {
          logger.warn("GameMap", "map.json not found");
          return;
        }

        const loadedMapNodes = sceneData.mapNodes.flatMap((node) => {
          const modelUrl = sceneData.models.get(node.name);
          return modelUrl ? [{ node, modelUrl }] : [];
        });
        const missingModelCount =
          sceneData.mapNodes.length - loadedMapNodes.length;

        if (missingModelCount > 0) {
          logger.warn(
            "GameMap",
            "Map nodes skipped because model files are missing",
            {
              missingModelCount,
            },
          );
        }

        setMapNodes(loadedMapNodes);
      } catch (error) {
        logger.error("GameMap", "Error loading map", {
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    };

    loadMap();
  }, []);

  return (
    <group ref={groupRef}>
      {mapNodes.map((mapNode, index) => (
        <ModelErrorBoundary
          key={index}
          modelUrl={mapNode.modelUrl}
          node={mapNode.node}
        >
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
  const { position, rotation, scale } = node;
  const { scene } = useLoggedGLTF(modelUrl, {
    scope: "GameMap.ModelInstance",
    position,
    rotation,
    scale,
  });
  const sceneInstance = useClonedObject(scene);

  return (
    <primitive
      object={sceneInstance}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}
