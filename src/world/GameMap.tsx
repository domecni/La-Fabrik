import type { ReactNode } from "react";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { TerrainModel } from "@/components/three/world/TerrainModel";
import { GameMapCollision } from "@/world/GameMapCollision";
import { MapInstancingSystem } from "@/world/map-instancing/MapInstancingSystem";
import { isInstancedMapNodeName } from "@/world/map-instancing/mapInstancingConfig";
import { VegetationSystem } from "@/world/vegetation/VegetationSystem";
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

const MAP_STRUCTURE_NODE_NAMES = new Set(["Scene", "blocking"]);
const LITE_MAP_SKIPPED_NODE_NAMES = new Set([
  "arbre",
  "buisson",
  "champdeble",
  "champdesoja",
  "champsdetournesol",
  "sapin",
]);

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  modelUrl: string | null;
  node: MapNode;
  onSettled: () => void;
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
    this.props.onSettled();
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

export function GameMap({
  buildOctree = true,
  onLoaded,
  onLoadingStateChange,
  onOctreeReady,
}: GameMapProps): React.JSX.Element {
  const settledMapNodesRef = useRef(new Set<number>());
  const [mapNodes, setMapNodes] = useState<LoadedMapNode[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [settledMapNodeCount, setSettledMapNodeCount] = useState(0);
  const mapReady = mapLoaded && settledMapNodeCount >= mapNodes.length;

  const handleMapNodeSettled = useCallback((index: number) => {
    if (settledMapNodesRef.current.has(index)) return;

    settledMapNodesRef.current.add(index);
    setSettledMapNodeCount(settledMapNodesRef.current.size);
  }, []);

  const showEmptyMap = useCallback(
    (currentStep: string) => {
      setMapNodes([]);
      setMapLoaded(true);
      settledMapNodesRef.current.clear();
      setSettledMapNodeCount(0);
      onLoadingStateChange?.({
        currentStep,
        progress: 0.7,
        status: "loading",
      });
    },
    [onLoadingStateChange],
  );

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
          showEmptyMap("Map introuvable");
          return;
        }

        onLoadingStateChange?.({
          currentStep: "Importation des models",
          progress: 0.18,
          status: "loading",
        });

        const visibleMapNodes = sceneData.mapNodes.filter(liteMap);
        const skippedMapNodeCount =
          sceneData.mapNodes.length - visibleMapNodes.length;

        if (skippedMapNodeCount > 0) {
          logger.warn("GameMap", "Lite map skipped heavy map nodes", {
            skippedMapNodeCount,
          });
        }

        const loadedMapNodes = visibleMapNodes.map((node) => {
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
        settledMapNodesRef.current.clear();
        setSettledMapNodeCount(0);
        onLoadingStateChange?.({
          currentStep: "Chargement des modèles de la map",
          progress: 0.25,
          status: "loading",
        });
      } catch (error) {
        logger.error("GameMap", "Error loading map", {
          error: error instanceof Error ? error : new Error(String(error)),
        });
        showEmptyMap("Erreur de chargement de la map");
      }
    };

    loadMap();
  }, [onLoadingStateChange, showEmptyMap]);

  useEffect(() => {
    if (mapNodes.length === 0) return;

    const renderProgress =
      mapNodes.length === 0 ? 1 : settledMapNodeCount / mapNodes.length;
    onLoadingStateChange?.({
      currentStep: "Chargement des modèles de la map",
      progress: 0.25 + renderProgress * 0.45,
      status: "loading",
    });
  }, [mapNodes.length, onLoadingStateChange, settledMapNodeCount]);

  return (
    <>
      <group>
        {mapNodes.map((mapNode, index) => (
          <ModelErrorBoundary
            key={index}
            fallback={<FallbackMapNode node={mapNode.node} />}
            modelUrl={mapNode.modelUrl}
            node={mapNode.node}
            onSettled={() => handleMapNodeSettled(index)}
          >
            <MapNodeInstance
              node={mapNode.node}
              modelUrl={mapNode.modelUrl}
              onSettled={() => handleMapNodeSettled(index)}
            />
          </ModelErrorBoundary>
        ))}
      </group>
      <MapInstancingSystem />
      <VegetationSystem />
      <TerrainModel />
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

/**
 * Temporary development-only map reducer.
 *
 * TODO: replace this with a real map performance pass: merged static geometry,
 * instancing for repeated props, LOD, and/or zone-based loading. For now this
 * keeps the app usable on local machines by not rendering the densest exported
 * nodes from map.json.
 */
function liteMap(node: MapNode): boolean {
  if (MAP_STRUCTURE_NODE_NAMES.has(node.name)) {
    return false;
  }

  if (node.type === "Mesh") {
    return false;
  }

  return (
    !LITE_MAP_SKIPPED_NODE_NAMES.has(node.name) &&
    !isInstancedMapNodeName(node.name)
  );
}

function MapNodeInstance({
  node,
  modelUrl,
  onSettled,
}: {
  node: MapNode;
  modelUrl: string | null;
  onSettled: () => void;
}): React.JSX.Element {
  useEffect(() => {
    if (modelUrl !== null) return;

    onSettled();
  }, [modelUrl, onSettled]);

  if (!modelUrl) {
    return <FallbackMapNode node={node} />;
  }

  return (
    <Suspense fallback={<FallbackMapNode node={node} />}>
      <ModelInstance node={node} modelUrl={modelUrl} onLoaded={onSettled} />
    </Suspense>
  );
}

function ModelInstance({
  node,
  modelUrl,
  onLoaded,
}: {
  node: MapNode;
  modelUrl: string;
  onLoaded: () => void;
}): React.JSX.Element {
  const { position, rotation, scale } = node;
  const { scene } = useLoggedGLTF(modelUrl, {
    scope: "GameMap.ModelInstance",
    position,
    rotation,
    scale,
  });
  const sceneInstance = useClonedObject(scene);

  useEffect(() => {
    sceneInstance.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    onLoaded();
  }, [onLoaded, sceneInstance]);

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
