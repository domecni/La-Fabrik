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
import {
  CHARACTER_CONFIGS,
  CHARACTER_IDS,
  type CharacterId,
} from "@/data/world/characters/characterConfig";
import {
  CHARACTER_OCTREE_COLLISION_BOX,
  LA_FABRIK_INTERIOR_COLLISION_BOXES,
  MAP_OCTREE_COLLISION_BOXES,
  hasMapOctreeCollisionBox,
  type OctreeCollisionBox,
} from "@/data/world/octreeCollisionConfig";
import { getMapModelScaleMultiplier } from "@/data/world/mapInstancingConfig";
import { useCharacterDebugStore } from "@/managers/stores/useCharacterDebugStore";
import { useGameStore } from "@/managers/stores/useGameStore";
import { WorldBoundsCollision } from "@/world/collision/WorldBoundsCollision";
import type { MapNode } from "@/types/map/mapScene";
import type { OctreeReadyHandler, Vector3Tuple } from "@/types/three/three";
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
  proxyNodes: readonly MapNode[];
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
  proxyNodes,
  onLoaded,
  onLoadingStateChange,
  onOctreeReady,
}: GameMapCollisionProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const settledCollisionNodesRef = useRef(new Set<number>());
  const loadedNotifiedRef = useRef(false);
  const [settledCollisionNodeCount, setSettledCollisionNodeCount] = useState(0);
  const mainState = useGameStore((state) => state.mainState);
  const terrainHeight = useTerrainHeightSampler();
  const collisionNodes = nodes.filter(isCollisionNode);
  const includeCharacterCollisions = mainState !== "ebike";
  const characterCollisionCount = includeCharacterCollisions
    ? CHARACTER_IDS.length
    : 0;
  const collisionSourceCount =
    collisionNodes.length + proxyNodes.length + characterCollisionCount;
  const collisionReady =
    mapReady && settledCollisionNodeCount >= collisionNodes.length;
  const characterCollisionSignature = useCharacterDebugStore((state) =>
    includeCharacterCollisions
      ? CHARACTER_IDS.map((id) => {
          const character = state.characters[id];
          return [...character.position, ...character.rotation].join(",");
        }).join("|")
      : "characters-hidden",
  );
  const collisionRebuildKey = collisionReady
    ? `${collisionNodes.length}:${collisionSourceCount}:${characterCollisionSignature}`
    : "pending";

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
    collisionRebuildKey,
    buildOctree && collisionReady && collisionSourceCount > 0,
  );

  useEffect(() => {
    if (!mapReady) return;

    if (collisionSourceCount === 0) {
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
    collisionSourceCount,
    collisionReady,
    mapReady,
    notifyLoaded,
    onLoadingStateChange,
  ]);

  return (
    <group ref={groupRef} visible={false}>
      {mapReady ? <WorldBoundsCollision /> : null}
      {mapReady
        ? proxyNodes.map((node, index) => (
            <MapCollisionBoxProxy
              key={`proxy-collision-${index}`}
              node={node}
              terrainHeight={terrainHeight}
            />
          ))
        : null}
      {mapReady && includeCharacterCollisions ? (
        <CharacterCollisionProxies terrainHeight={terrainHeight} />
      ) : null}
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
  useEffect(() => {
    // Strip the door slab AND its Solidify-modifier frame from the la fabrik
    // collision octree so the player can walk through the doorway. The visual
    // model is rendered separately by `MergedStaticMapModel` and is unaffected.
    //
    // - `porte` (+ Blender suffixes `porte.001` / `porte_001`): the door slab
    //   itself. We exclude unrelated names like `porte stock` (a shelf of
    //   stocked doors) by requiring an exact match or a numeric suffix only.
    // - Children of a `Thicken` parent: the doorway frame produced by
    //   Blender's Solidify modifier. Its world AABBs sit right inside the
    //   doorway and otherwise prevent the player from entering / exiting.
    if (node.name !== "lafabrik") return;

    const isDoorSlab = (name: string): boolean =>
      name === "porte" || /^porte[._]\d+$/i.test(name);
    const isDoorFrameThickenChild = (child: THREE.Object3D): boolean =>
      child.parent?.name === "Thicken";

    const doorMeshes: THREE.Object3D[] = [];
    sceneInstance.traverse((child) => {
      if (isDoorSlab(child.name) || isDoorFrameThickenChild(child)) {
        doorMeshes.push(child);
      }
    });
    for (const child of doorMeshes) {
      child.removeFromParent();
    }
  }, [node.name, sceneInstance]);
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
    <>
      <primitive
        object={sceneInstance}
        position={collisionPosition}
        rotation={rotation}
        scale={normalizedScale}
      />
      {node.name === "lafabrik" ? (
        <group
          name="lafabrik-interior-collision-proxies"
          position={collisionPosition}
          rotation={rotation}
          scale={normalizedScale}
        >
          {LA_FABRIK_INTERIOR_COLLISION_BOXES.map((box, index) => (
            <CollisionBox key={`lafabrik-interior-${index}`} box={box} />
          ))}
        </group>
      ) : null}
    </>
  );
}

function CollisionBox({ box }: { box: OctreeCollisionBox }): React.JSX.Element {
  return (
    <group position={box.center}>
      <mesh>
        <boxGeometry args={box.size} />
        <meshBasicMaterial />
      </mesh>
      {/* Octree ignores material.side, so rotate a second shell for X/Z collisions. */}
      <mesh rotation={[0, Math.PI, 0]}>
        <boxGeometry args={box.size} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

function createScaledMapNodeScale(node: MapNode): Vector3Tuple {
  const baseScale = normalizeMapScale(node.scale);
  const scaleMultiplier = getMapModelScaleMultiplier(node.name);

  return [
    baseScale[0] * scaleMultiplier,
    baseScale[1] * scaleMultiplier,
    baseScale[2] * scaleMultiplier,
  ];
}

function MapCollisionBoxProxy({
  node,
  terrainHeight,
}: {
  node: MapNode;
  terrainHeight: TerrainHeightSampler;
}): React.JSX.Element | null {
  const collisionBox = hasMapOctreeCollisionBox(node.name)
    ? MAP_OCTREE_COLLISION_BOXES[node.name]
    : null;
  const normalizedScale = useMemo(() => createScaledMapNodeScale(node), [node]);
  const position = useMemo(() => {
    const [x, y, z] = node.position;
    if (!collisionBox) return [x, y, z] satisfies Vector3Tuple;

    const height = terrainHeight.getHeight(x, z);
    const bottomOffset = -collisionBox.bottomY * normalizedScale[1];

    return [x, (height ?? y) + bottomOffset, z] satisfies Vector3Tuple;
  }, [collisionBox, node.position, normalizedScale, terrainHeight]);

  if (!collisionBox) return null;

  return (
    <group
      name={`${node.name}-octree-collision-proxy`}
      position={position}
      rotation={node.rotation}
      scale={normalizedScale}
    >
      <CollisionBox box={collisionBox} />
    </group>
  );
}

function CharacterCollisionProxies({
  terrainHeight,
}: {
  terrainHeight: TerrainHeightSampler;
}): React.JSX.Element {
  return (
    <>
      {CHARACTER_IDS.map((id) => (
        <CharacterCollisionProxy
          key={`character-collision-${id}`}
          id={id}
          terrainHeight={terrainHeight}
        />
      ))}
    </>
  );
}

function CharacterCollisionProxy({
  id,
  terrainHeight,
}: {
  id: CharacterId;
  terrainHeight: TerrainHeightSampler;
}): React.JSX.Element {
  const config = CHARACTER_CONFIGS[id];
  const state = useCharacterDebugStore((store) => store.characters[id]);
  const position = useMemo(() => {
    const [x, y, z] = state.position;
    const height = terrainHeight.getHeight(x, z);

    return [x, height ?? y, z] satisfies Vector3Tuple;
  }, [state.position, terrainHeight]);

  return (
    <group
      name={`${config.id}-octree-collision-proxy`}
      position={position}
      rotation={state.rotation}
    >
      <CollisionBox box={CHARACTER_OCTREE_COLLISION_BOX} />
    </group>
  );
}
