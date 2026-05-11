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
import { useOctreeGraphNode } from "@/hooks/three/useOctreeGraphNode";
import type { MapNode } from "@/types/editor/editor";
import type { OctreeReadyHandler } from "@/types/three/three";
import type { SceneLoadingChangeHandler } from "@/types/world/sceneLoading";
import { logModelLoadError } from "@/utils/three/modelLoadLogger";

export interface GameMapCollisionNode {
  node: MapNode;
  modelUrl: string | null;
}

interface ResolvedGameMapCollisionNode {
  node: MapNode;
  modelUrl: string;
}

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

const MAP_COLLISION_NODE_NAMES = new Set(["terrain"]);

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
  return (
    mapNode.modelUrl !== null && MAP_COLLISION_NODE_NAMES.has(mapNode.node.name)
  );
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
  const [settledCollisionNodeCount, setSettledCollisionNodeCount] = useState(0);
  const collisionNodes = nodes.filter(isCollisionNode);
  const collisionReady =
    mapReady && settledCollisionNodeCount >= collisionNodes.length;

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
      onLoaded?.();
    },
    [onLoaded, onLoadingStateChange, onOctreeReady],
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
      onLoaded?.();
      return;
    }

    if (collisionReady) return;

    onLoadingStateChange?.({
      currentStep: "Ajout de la collision",
      progress: 0.86,
      status: "loading",
    });
  }, [
    collisionNodes.length,
    collisionReady,
    mapReady,
    onLoaded,
    onLoadingStateChange,
  ]);

  return (
    <group ref={groupRef} visible={false}>
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
}: {
  node: MapNode;
  modelUrl: string;
  onLoaded: () => void;
}): React.JSX.Element {
  const { position, rotation, scale } = node;
  const { scene } = useLoggedGLTF(modelUrl, {
    scope: "GameMapCollision.ModelInstance",
    position,
    rotation,
    scale,
  });
  const sceneInstance = useClonedObject(scene);

  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  return (
    <primitive
      object={sceneInstance}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}
