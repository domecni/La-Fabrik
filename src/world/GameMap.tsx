import type { ReactNode } from "react";
import { Component, Suspense, useEffect, useState } from "react";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { GameMapCollision } from "@/world/GameMapCollision";
import type { SceneLoadingChangeHandler } from "@/types/world/sceneLoading";
import { logger } from "@/utils/core/Logger";
import { loadMapSceneData } from "@/utils/map/loadMapSceneData";
import { logModelLoadError } from "@/utils/three/modelLoadLogger";
import type { MapNode } from "@/types/editor/editor";
import type { OctreeReadyHandler } from "@/types/three/three";

interface LoadedMapNode {
  node: MapNode;
  modelUrl: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  modelUrl: string | null;
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
        modelPath: this.props.modelUrl ?? `missing:${this.props.node.name}`,
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
      return this.props.fallback;
    }

    return this.props.children;
  }
}

interface GameMapProps {
  onLoaded?: (() => void) | undefined;
  onLoadingStateChange?: SceneLoadingChangeHandler | undefined;
  onOctreeReady: OctreeReadyHandler;
  buildOctree?: boolean;
}

const MAP_RENDER_BATCH_SIZE = 12;

export function GameMap({
  buildOctree = true,
  onLoaded,
  onLoadingStateChange,
  onOctreeReady,
}: GameMapProps): React.JSX.Element {
  const [mapNodes, setMapNodes] = useState<LoadedMapNode[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [visibleNodeCount, setVisibleNodeCount] = useState(0);
  const visibleMapNodes = mapNodes.slice(0, visibleNodeCount);
  const mapReady = mapLoaded && visibleNodeCount >= mapNodes.length;

  useEffect(() => {
    onLoadingStateChange?.({
      currentStep: "Récupération blocking",
      progress: 0.05,
      status: "loading",
    });

    const loadMap = async () => {
      try {
        const sceneData = await loadMapSceneData();
        if (!sceneData) {
          logger.warn("GameMap", "map.json not found");
          onLoadingStateChange?.({
            currentStep: "Map introuvable",
            progress: 1,
            status: "loading",
          });
          return;
        }

        onLoadingStateChange?.({
          currentStep: "Importation des models",
          progress: 0.18,
          status: "loading",
        });

        const loadedMapNodes = sceneData.mapNodes.map((node) => {
          const modelUrl = sceneData.models.get(node.name);
          return { node, modelUrl: modelUrl ?? null };
        });
        const missingModelCount = loadedMapNodes.filter(
          (mapNode) => mapNode.modelUrl === null,
        ).length;

        if (missingModelCount > 0) {
          logger.warn(
            "GameMap",
            "Map nodes rendered as fallback cubes because model files are missing",
            {
              missingModelCount,
            },
          );
        }

        setMapNodes(loadedMapNodes);
        setMapLoaded(true);
        setVisibleNodeCount(0);
        onLoadingStateChange?.({
          currentStep: "Montage progressif des models",
          progress: 0.25,
          status: "loading",
        });
      } catch (error) {
        logger.error("GameMap", "Error loading map", {
          error: error instanceof Error ? error : new Error(String(error)),
        });
        onLoadingStateChange?.({
          currentStep: "Erreur de chargement de la map",
          progress: 1,
          status: "loading",
        });
      }
    };

    loadMap();
  }, [onLoaded, onLoadingStateChange]);

  useEffect(() => {
    if (mapNodes.length === 0 || visibleNodeCount >= mapNodes.length) return;

    const frameId = window.requestAnimationFrame(() => {
      setVisibleNodeCount((current) =>
        Math.min(current + MAP_RENDER_BATCH_SIZE, mapNodes.length),
      );
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [mapNodes.length, visibleNodeCount]);

  useEffect(() => {
    if (mapNodes.length === 0) return;

    const renderProgress =
      mapNodes.length === 0 ? 1 : visibleNodeCount / mapNodes.length;
    onLoadingStateChange?.({
      currentStep: "Montage progressif des models",
      progress: 0.25 + renderProgress * 0.45,
      status: "loading",
    });
  }, [mapNodes.length, onLoadingStateChange, visibleNodeCount]);

  return (
    <>
      <group>
        {visibleMapNodes.map((mapNode, index) => (
          <ModelErrorBoundary
            key={index}
            fallback={<FallbackMapNode node={mapNode.node} />}
            modelUrl={mapNode.modelUrl}
            node={mapNode.node}
          >
            {mapNode.modelUrl ? (
              <Suspense fallback={<FallbackMapNode node={mapNode.node} />}>
                <ModelInstance
                  node={mapNode.node}
                  modelUrl={mapNode.modelUrl}
                />
              </Suspense>
            ) : (
              <FallbackMapNode node={mapNode.node} />
            )}
          </ModelErrorBoundary>
        ))}
      </group>
      <GameMapCollision
        buildOctree={buildOctree}
        mapReady={mapReady}
        nodes={mapNodes}
        onLoaded={onLoaded}
        onLoadingStateChange={onLoadingStateChange}
        onOctreeReady={onOctreeReady}
      />
    </>
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

function FallbackMapNode({ node }: { node: MapNode }): React.JSX.Element {
  const { position, rotation, scale } = node;

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#64748b" wireframe />
    </mesh>
  );
}
