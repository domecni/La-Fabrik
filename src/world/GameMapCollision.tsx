import type { ReactNode } from "react";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { useOctreeGraphNode } from "@/hooks/three/useOctreeGraphNode";
import {
  getObjectBottomOffset,
  normalizeMapScale,
  useTerrainHeightSampler,
} from "@/hooks/three/useTerrainHeight";
import { WorldBoundsCollision } from "@/world/collision/WorldBoundsCollision";
import type { MapNode } from "@/types/map/mapScene";
import type { OctreeReadyHandler } from "@/types/three/three";
import type { SceneLoadingChangeHandler } from "@/types/world/sceneLoading";
import { logModelLoadError } from "@/utils/three/modelLoadLogger";

interface GameMapCollisionNode {
  node: MapNode;
  modelUrl: string | null;
}

interface ResolvedGameMapCollisionNode {
  node: MapNode;
  modelUrl: string;
}

type TerrainHeightSampler = ReturnType<typeof useTerrainHeightSampler>;

interface GameMapCollisionProps {
  buildOctree?: boolean;
  mapReady: boolean;
  nodes: readonly GameMapCollisionNode[];
  onLoaded?: (() => void) | undefined;
  onLoadingStateChange?: SceneLoadingChangeHandler | undefined;
  onOctreeReady: OctreeReadyHandler;
}

interface CollisionErrorBoundaryProps {
  children: ReactNode;
  modelUrl: string;
  node: MapNode;
  onSettled: () => void;
}

interface CollisionErrorBoundaryState {
  hasError: boolean;
}

class CollisionErrorBoundary extends Component<
  CollisionErrorBoundaryProps,
  CollisionErrorBoundaryState
> {
  constructor(props: CollisionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): CollisionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    logModelLoadError(
      {
        modelPath: this.props.modelUrl,
        scope: "GameMapCollision.ModelInstance",
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
      return null;
    }

    return this.props.children;
  }
}

function isCollisionNode(
  mapNode: GameMapCollisionNode,
): mapNode is ResolvedGameMapCollisionNode {
  return mapNode.modelUrl !== null;
}

export function GameMapCollision({
  buildOctree = true,
  mapReady,
  nodes,
  onLoaded,
  onLoadingStateChange,
  onOctreeReady,
}: GameMapCollisionProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const settledCollisionNodesRef = useRef(new Set<number>());
  const loadedNotifiedRef = useRef(false);
  const [settledCollisionNodeCount, setSettledCollisionNodeCount] = useState(0);
  const terrainHeight = useTerrainHeightSampler();
  const collisionNodes = nodes.filter(isCollisionNode);
  const collisionReady =
    mapReady && settledCollisionNodeCount >= collisionNodes.length;

  const notifyLoaded = useCallback(() => {
    if (loadedNotifiedRef.current) return;

    loadedNotifiedRef.current = true;
    onLoaded?.();
  }, [onLoaded]);

  const handleCollisionNodeSettled = useCallback((index: number) => {
    if (settledCollisionNodesRef.current.has(index)) return;

    settledCollisionNodesRef.current.add(index);
    setSettledCollisionNodeCount(settledCollisionNodesRef.current.size);
  }, []);

  const handleOctreeReady = useCallback<OctreeReadyHandler>(
    (octree) => {
      onLoadingStateChange?.({
        currentStep: "Collision prête",
        progress: 0.92,
        status: "loading",
      });
      onOctreeReady(octree);
      notifyLoaded();
    },
    [notifyLoaded, onLoadingStateChange, onOctreeReady],
  );

  useOctreeGraphNode(
    groupRef,
    handleOctreeReady,
    collisionReady ? collisionNodes.length : 0,
    buildOctree && collisionReady && collisionNodes.length > 0,
  );

  useEffect(() => {
    if (!mapReady) return;

    if (collisionNodes.length === 0) {
      notifyLoaded();
      return;
    }

    if (collisionReady && !buildOctree) {
      notifyLoaded();
      return;
    }

    if (collisionReady) return;

    onLoadingStateChange?.({
      currentStep: "Ajout de la collision",
      progress: 0.86,
      status: "loading",
    });
  }, [
    buildOctree,
    collisionNodes.length,
    collisionReady,
    mapReady,
    notifyLoaded,
    onLoadingStateChange,
  ]);

  return (
    <group ref={groupRef} visible={false}>
      {mapReady ? <WorldBoundsCollision /> : null}
      {mapReady
        ? collisionNodes.map((mapNode, index) => (
            <CollisionErrorBoundary
              key={`collision-${index}`}
              node={mapNode.node}
              modelUrl={mapNode.modelUrl}
              onSettled={() => handleCollisionNodeSettled(index)}
            >
              <Suspense fallback={null}>
                <CollisionModelInstance
                  node={mapNode.node}
                  modelUrl={mapNode.modelUrl}
                  onLoaded={() => handleCollisionNodeSettled(index)}
                  terrainHeight={terrainHeight}
                />
              </Suspense>
            </CollisionErrorBoundary>
          ))
        : null}
    </group>
  );
}

function CollisionModelInstance({
  node,
  modelUrl,
  onLoaded,
  terrainHeight,
}: {
  node: MapNode;
  modelUrl: string;
  onLoaded: () => void;
  terrainHeight: TerrainHeightSampler;
}): React.JSX.Element {
  const { position, rotation, scale } = node;
  const normalizedScale = normalizeMapScale(scale);
  const { scene } = useLoggedGLTF(modelUrl, {
    scope: "GameMapCollision.ModelInstance",
    position,
    rotation,
    scale: normalizedScale,
  });
  const sceneInstance = useClonedObject(scene);
  const collisionPosition = useMemo(() => {
    if (node.name === "terrain") return position;

    const [x, y, z] = position;
    const height = terrainHeight.getHeight(x, z);
    const bottomOffset = getObjectBottomOffset(sceneInstance, normalizedScale);
    return [x, height !== null ? height + bottomOffset : y, z] as const;
  }, [node.name, normalizedScale, position, sceneInstance, terrainHeight]);

  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  return (
    <primitive
      object={sceneInstance}
      position={collisionPosition}
      rotation={rotation}
      scale={normalizedScale}
    />
  );
}
