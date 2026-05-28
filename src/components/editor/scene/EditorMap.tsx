import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { TransformControls } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { TerrainModel } from "@/components/three/world/TerrainModel";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import {
  getObjectBottomOffset,
  useTerrainHeightSampler,
} from "@/hooks/three/useTerrainHeight";
import type { SceneData, MapNode, TransformMode } from "@/types/editor/editor";
import {
  isEditorVisibleMapNode,
  getTerrainMapNode,
} from "@/utils/map/mapRuntimeClassification";
import { getMapModelScaleMultiplier } from "@/data/world/mapInstancingConfig";
import { getVegetationModelScaleMultiplier } from "@/data/world/vegetationConfig";

interface EditorMapProps {
  sceneData: SceneData;
  selectedNodeIndex: number | null;
  selectedNodeIndexes: number[];
  onSelectNode: (index: number | null) => void;
  onToggleNodeSelection: (index: number) => void;
  isSelectionLocked: boolean;
  hoveredNodeIndex: number | null;
  onHoverNode: (index: number | null) => void;
  transformMode: TransformMode;
  snapToTerrain: boolean;
  lockTerrainSelection: boolean;
  onTransformStart: () => void;
  onTransformEnd: () => void;
  onNodeTransform: (nodeIndex: number, transform: MapNode) => void;
  snapAllToTerrainRequest: number;
  onSnapAllToTerrain: (mapNodes: MapNode[]) => void;
}

type EditorNodeObjectRef = React.RefObject<Map<number, THREE.Object3D>>;

interface EditorNodeCommonProps {
  index: number;
  node: MapNode;
  isSelected: boolean;
  isHovered: boolean;
  objectsMapRef: EditorNodeObjectRef;
  onSelectNode: (index: number | null) => void;
  onToggleNodeSelection: (index: number) => void;
  isSelectionLocked: boolean;
  onHoverNode: (index: number | null) => void;
}

interface EditorNodePointerHandlers {
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  onContextMenu: (event: ThreeEvent<MouseEvent>) => void;
  onPointerEnter: (event: ThreeEvent<PointerEvent>) => void;
  onPointerLeave: (event: ThreeEvent<PointerEvent>) => void;
}

interface TransformSnapshot {
  groupMatrix: THREE.Matrix4;
  objects: Map<number, THREE.Matrix4>;
}

const TEMP_BOX = new THREE.Box3();
const TEMP_CENTER = new THREE.Vector3();
const TEMP_DELTA_MATRIX = new THREE.Matrix4();
const TEMP_INVERSE_GROUP_MATRIX = new THREE.Matrix4();
const TEMP_POSITION = new THREE.Vector3();
const TEMP_QUATERNION = new THREE.Quaternion();
const TEMP_SCALE = new THREE.Vector3();

function isOriginPosition(position: MapNode["position"]): boolean {
  return position.every((value) => Math.abs(value) < 0.0001);
}

function isSnapAllCandidate(node: MapNode): boolean {
  return (
    isEditorVisibleMapNode(node) &&
    node.name !== "terrain" &&
    !isOriginPosition(node.position)
  );
}

function shouldRenderEditorNode(
  node: MapNode,
  selectedNodeName: string | null,
): boolean {
  if (!isEditorVisibleMapNode(node)) return false;
  return selectedNodeName === null || node.name === selectedNodeName;
}

function getEditorModelVisualScaleMultiplier(name: string): number {
  return (
    getMapModelScaleMultiplier(name) * getVegetationModelScaleMultiplier(name)
  );
}

function getEditorModelVisualYOffset(
  object: THREE.Object3D,
  node: MapNode,
  terrainHeight: ReturnType<typeof useTerrainHeightSampler>,
  visualScaleMultiplier: number,
): number {
  const [x, y, z] = node.position;
  const height = terrainHeight.getHeight(x, z);
  if (height === null) return 0;

  const finalScale: [number, number, number] = [
    node.scale[0] * visualScaleMultiplier,
    node.scale[1] * visualScaleMultiplier,
    node.scale[2] * visualScaleMultiplier,
  ];
  const originalPosition = object.position.clone();
  object.position.set(0, 0, 0);
  const bottomOffset = getObjectBottomOffset(object, finalScale);
  object.position.copy(originalPosition);
  const parentScaleY = Math.abs(node.scale[1]) > 0.0001 ? node.scale[1] : 1;

  return (height + bottomOffset - y) / parentScaleY;
}

function applyNodeTransform(object: THREE.Object3D, node: MapNode): void {
  object.position.set(...node.position);
  object.rotation.set(...node.rotation);
  object.scale.set(...node.scale);
}

function useRegisteredEditorNode(
  objectRef: React.RefObject<THREE.Object3D | null>,
  index: number,
  node: MapNode,
  objectsMapRef: EditorNodeObjectRef,
): void {
  useEffect(() => {
    const object = objectRef.current;
    if (object) {
      applyNodeTransform(object, node);
      object.userData = { nodeIndex: index, nodeName: node.name };
      objectsMapRef.current.set(index, object);
    }

    const currentMap = objectsMapRef.current;
    const currentIndex = index;
    return () => {
      currentMap.delete(currentIndex);
    };
  }, [index, node, objectRef, objectsMapRef]);

  useEffect(() => {
    const object = objectRef.current;
    if (object) {
      applyNodeTransform(object, node);
    }
  }, [node, objectRef]);
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }

  material.dispose();
}

function cloneHighlightedMaterial(
  material: THREE.Material | THREE.Material[],
  color: string,
): THREE.Material | THREE.Material[] {
  if (Array.isArray(material)) {
    return material.map((item) => cloneHighlightedMaterial(item, color)).flat();
  }

  const clone = material.clone();
  if (clone instanceof THREE.MeshStandardMaterial) {
    clone.color.set(color);
  }
  return clone;
}

function getNodeHighlightColor(
  isSelected: boolean,
  isHovered: boolean,
): string | null {
  if (isSelected) return "#ffffff";
  if (isHovered) return "#b8b8b8";
  return null;
}

function createEditorNodePointerHandlers(
  index: number,
  onSelectNode: (index: number | null) => void,
  onToggleNodeSelection: (index: number) => void,
  isSelectionLocked: boolean,
  onHoverNode: (index: number | null) => void,
): EditorNodePointerHandlers {
  return {
    onClick: (event) => {
      event.stopPropagation();
      if (isSelectionLocked) return;
      onSelectNode(index);
    },
    onContextMenu: (event) => {
      event.stopPropagation();
      event.nativeEvent.preventDefault();
      if (!event.nativeEvent.shiftKey || isSelectionLocked) return;
      onToggleNodeSelection(index);
    },
    onPointerEnter: (event) => {
      event.stopPropagation();
      onHoverNode(index);
    },
    onPointerLeave: (event) => {
      event.stopPropagation();
      onHoverNode(null);
    },
  };
}

export function EditorMap({
  sceneData,
  selectedNodeIndex,
  selectedNodeIndexes,
  onSelectNode,
  onToggleNodeSelection,
  isSelectionLocked,
  hoveredNodeIndex,
  onHoverNode,
  transformMode,
  snapToTerrain,
  lockTerrainSelection,
  onTransformStart,
  onTransformEnd,
  onNodeTransform,
  snapAllToTerrainRequest,
  onSnapAllToTerrain,
}: EditorMapProps): React.JSX.Element {
  const objectsMapRef = useRef<Map<number, THREE.Object3D>>(new Map());
  const transformGroupRef = useRef<THREE.Group>(null);
  const transformSnapshotRef = useRef<TransformSnapshot | null>(null);
  const terrainHeight = useTerrainHeightSampler();
  const lastSnapAllToTerrainRequestRef = useRef(0);

  const selectedIndexSet = new Set(selectedNodeIndexes);
  const isMultiSelection = selectedNodeIndexes.length > 1;
  const selectedNodeName =
    selectedNodeIndex !== null
      ? (sceneData.mapNodes[selectedNodeIndex]?.name ?? null)
      : null;
  const getTransformObject = useCallback(() => {
    if (isMultiSelection) {
      return transformGroupRef.current;
    }

    if (selectedNodeIndex !== null) {
      return objectsMapRef.current.get(selectedNodeIndex) ?? null;
    }

    return null;
  }, [isMultiSelection, selectedNodeIndex]);

  const prepareTransformGroup = useCallback(() => {
    if (!isMultiSelection || !transformGroupRef.current) return;

    const selectedObjects = selectedNodeIndexes
      .map((index) => objectsMapRef.current.get(index))
      .filter((object): object is THREE.Object3D => Boolean(object));

    if (selectedObjects.length === 0) return;

    TEMP_BOX.makeEmpty();
    for (const object of selectedObjects) {
      object.updateWorldMatrix(true, false);
      TEMP_BOX.expandByPoint(object.getWorldPosition(TEMP_CENTER));
    }

    TEMP_BOX.getCenter(TEMP_CENTER);
    transformGroupRef.current.position.copy(TEMP_CENTER);
    transformGroupRef.current.rotation.set(0, 0, 0);
    transformGroupRef.current.scale.set(1, 1, 1);
    transformGroupRef.current.updateMatrixWorld(true);
  }, [isMultiSelection, selectedNodeIndexes]);

  const createTransformSnapshot = useCallback((): TransformSnapshot | null => {
    const transformGroup = transformGroupRef.current;

    if (!isMultiSelection || !transformGroup) return null;

    const objects = new Map<number, THREE.Matrix4>();
    for (const index of selectedNodeIndexes) {
      const object = objectsMapRef.current.get(index);
      if (!object) continue;

      object.updateMatrixWorld(true);
      objects.set(index, object.matrix.clone());
    }

    transformGroup.updateMatrixWorld(true);
    return {
      groupMatrix: transformGroup.matrix.clone(),
      objects,
    };
  }, [isMultiSelection, selectedNodeIndexes]);

  const syncSelectedObjectTransform = () => {
    if (isMultiSelection) {
      const transformGroup = transformGroupRef.current;
      const snapshot = transformSnapshotRef.current;
      if (!transformGroup || !snapshot) return;

      transformGroup.updateMatrix();
      TEMP_INVERSE_GROUP_MATRIX.copy(snapshot.groupMatrix).invert();
      TEMP_DELTA_MATRIX.multiplyMatrices(
        transformGroup.matrix,
        TEMP_INVERSE_GROUP_MATRIX,
      );

      for (const [index, startMatrix] of snapshot.objects) {
        const obj = objectsMapRef.current.get(index);
        const node = sceneData.mapNodes[index];
        if (!obj || !node) continue;

        const nextMatrix = TEMP_DELTA_MATRIX.clone().multiply(startMatrix);
        nextMatrix.decompose(TEMP_POSITION, TEMP_QUATERNION, TEMP_SCALE);
        obj.position.copy(TEMP_POSITION);
        obj.quaternion.copy(TEMP_QUATERNION);
        obj.scale.copy(TEMP_SCALE);

        const terrainY = snapToTerrain
          ? terrainHeight.getHeight(obj.position.x, obj.position.z)
          : null;
        if (terrainY !== null && transformMode === "translate") {
          obj.position.y = terrainY;
        }

        onNodeTransform(index, {
          ...node,
          position: [obj.position.x, obj.position.y, obj.position.z],
          rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
          scale: [obj.scale.x, obj.scale.y, obj.scale.z],
        });
      }

      return;
    }

    if (selectedNodeIndex !== null) {
      const obj = objectsMapRef.current.get(selectedNodeIndex);
      if (!obj) return;
      const node = sceneData.mapNodes[selectedNodeIndex];
      if (node) {
        const terrainY = snapToTerrain
          ? terrainHeight.getHeight(obj.position.x, obj.position.z)
          : null;
        if (terrainY !== null && transformMode === "translate") {
          obj.position.y = terrainY;
        }

        const updatedNode: MapNode = {
          ...node,
          position: [
            obj.position.x,
            terrainY !== null && transformMode === "translate"
              ? terrainY
              : obj.position.y,
            obj.position.z,
          ],
          rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
          scale: [obj.scale.x, obj.scale.y, obj.scale.z],
        };
        onNodeTransform(selectedNodeIndex, updatedNode);
      }
    }
  };

  const handleTransformMouseDown = () => {
    prepareTransformGroup();
    transformSnapshotRef.current = createTransformSnapshot();
    onTransformStart();
  };

  const handleTransformMouseUp = () => {
    syncSelectedObjectTransform();
    transformSnapshotRef.current = null;
    prepareTransformGroup();
    onTransformEnd();
  };

  const terrainNode = getTerrainMapNode(sceneData.mapNodes);
  const terrainNodeIndex = terrainNode
    ? sceneData.mapNodes.indexOf(terrainNode)
    : -1;
  useLayoutEffect(() => {
    prepareTransformGroup();
  }, [prepareTransformGroup]);

  useEffect(() => {
    if (
      snapAllToTerrainRequest === 0 ||
      snapAllToTerrainRequest === lastSnapAllToTerrainRequestRef.current
    ) {
      return;
    }

    lastSnapAllToTerrainRequestRef.current = snapAllToTerrainRequest;

    const snappedNodes = sceneData.mapNodes.map((node) => {
      if (!isSnapAllCandidate(node)) return node;

      const [x, y, z] = node.position;
      const terrainY = terrainHeight.getHeight(x, z);
      if (terrainY === null || Math.abs(terrainY - y) < 0.0001) return node;

      return {
        ...node,
        position: [x, terrainY, z] satisfies [number, number, number],
      };
    });

    onSnapAllToTerrain(snappedNodes);
  }, [
    onSnapAllToTerrain,
    sceneData.mapNodes,
    snapAllToTerrainRequest,
    terrainHeight,
  ]);

  // TransformControls needs the current Three object; editor refs are managed outside React rendering.
  // eslint-disable-next-line react-hooks/refs
  const selectedObject = getTransformObject();

  return (
    <>
      <group>
        {terrainNode ? (
          <Suspense fallback={null}>
            <EditorTerrainNode
              index={terrainNodeIndex}
              node={terrainNode}
              isSelected={selectedIndexSet.has(terrainNodeIndex)}
              isHovered={hoveredNodeIndex === terrainNodeIndex}
              lockTerrainSelection={lockTerrainSelection}
              objectsMapRef={objectsMapRef}
              onSelectNode={onSelectNode}
              onToggleNodeSelection={onToggleNodeSelection}
              isSelectionLocked={isSelectionLocked}
              onHoverNode={onHoverNode}
            />
          </Suspense>
        ) : null}
        {sceneData.mapNodes.map((node, index) => {
          if (!shouldRenderEditorNode(node, selectedNodeName)) {
            return null;
          }

          const modelUrl = sceneData.models.get(node.name);

          if (modelUrl) {
            return (
              <Suspense
                key={index}
                fallback={
                  <EditorFallbackNode
                    index={index}
                    node={node}
                    isSelected={selectedIndexSet.has(index)}
                    isHovered={hoveredNodeIndex === index}
                    objectsMapRef={objectsMapRef}
                    onSelectNode={onSelectNode}
                    onToggleNodeSelection={onToggleNodeSelection}
                    isSelectionLocked={isSelectionLocked}
                    onHoverNode={onHoverNode}
                  />
                }
              >
                <EditorModelNode
                  index={index}
                  node={node}
                  modelUrl={modelUrl}
                  isSelected={selectedIndexSet.has(index)}
                  isHovered={hoveredNodeIndex === index}
                  objectsMapRef={objectsMapRef}
                  onSelectNode={onSelectNode}
                  onToggleNodeSelection={onToggleNodeSelection}
                  isSelectionLocked={isSelectionLocked}
                  onHoverNode={onHoverNode}
                />
              </Suspense>
            );
          } else {
            return (
              <EditorFallbackNode
                key={index}
                index={index}
                node={node}
                isSelected={selectedIndexSet.has(index)}
                isHovered={hoveredNodeIndex === index}
                objectsMapRef={objectsMapRef}
                onSelectNode={onSelectNode}
                onToggleNodeSelection={onToggleNodeSelection}
                isSelectionLocked={isSelectionLocked}
                onHoverNode={onHoverNode}
              />
            );
          }
        })}
      </group>

      <group ref={transformGroupRef} />

      {selectedObject && (
        <TransformControls
          object={selectedObject}
          mode={transformMode}
          onMouseDown={handleTransformMouseDown}
          onMouseUp={handleTransformMouseUp}
          onObjectChange={syncSelectedObjectTransform}
        />
      )}
    </>
  );
}

function EditorModelNode({
  index,
  node,
  modelUrl,
  isSelected,
  isHovered,
  objectsMapRef,
  onSelectNode,
  onToggleNodeSelection,
  isSelectionLocked,
  onHoverNode,
}: EditorNodeCommonProps & {
  modelUrl: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const originalMaterialsRef = useRef(
    new Map<THREE.Mesh, THREE.Material | THREE.Material[]>(),
  );
  const { scene } = useLoggedGLTF(modelUrl, {
    scope: "EditorMap.EditorModelNode",
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  });
  const sceneInstance = useClonedObject(scene);
  const terrainHeight = useTerrainHeightSampler();
  const visualScaleMultiplier = getEditorModelVisualScaleMultiplier(node.name);
  const visualYOffset = useMemo(
    () =>
      getEditorModelVisualYOffset(
        sceneInstance,
        node,
        terrainHeight,
        visualScaleMultiplier,
      ),
    [node, sceneInstance, terrainHeight, visualScaleMultiplier],
  );
  const pointerHandlers = createEditorNodePointerHandlers(
    index,
    onSelectNode,
    onToggleNodeSelection,
    isSelectionLocked,
    onHoverNode,
  );
  useRegisteredEditorNode(groupRef, index, node, objectsMapRef);

  useEffect(() => {
    if (!groupRef.current) return;
    const highlightColor = getNodeHighlightColor(isSelected, isHovered);

    groupRef.current.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }

      const originalMaterial = originalMaterialsRef.current.get(child);

      if (!originalMaterial) {
        originalMaterialsRef.current.set(child, child.material);
      }

      if (child.material !== originalMaterial && originalMaterial) {
        disposeMaterial(child.material);
      }

      if (highlightColor) {
        child.material = cloneHighlightedMaterial(
          originalMaterial ?? child.material,
          highlightColor,
        );
      } else if (originalMaterial) {
        child.material = originalMaterial;
      }
    });
  }, [isSelected, isHovered]);

  useEffect(() => {
    const group = groupRef.current;
    const originalMaterials = originalMaterialsRef.current;

    return () => {
      if (!group) return;

      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) {
          return;
        }

        const originalMaterial = originalMaterials.get(child);
        if (originalMaterial && child.material !== originalMaterial) {
          disposeMaterial(child.material);
          child.material = originalMaterial;
        }
      });
    };
  }, []);

  return (
    <group
      ref={groupRef}
      position={node.position}
      rotation={node.rotation}
      scale={node.scale}
      {...pointerHandlers}
    >
      <primitive
        object={sceneInstance}
        position={[0, visualYOffset, 0]}
        scale={visualScaleMultiplier}
      />
    </group>
  );
}

function EditorTerrainNode({
  index,
  node,
  lockTerrainSelection,
  objectsMapRef,
  onSelectNode,
  onToggleNodeSelection,
  isSelectionLocked,
  onHoverNode,
}: EditorNodeCommonProps & { lockTerrainSelection: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointerHandlers = createEditorNodePointerHandlers(
    index,
    onSelectNode,
    onToggleNodeSelection,
    isSelectionLocked,
    onHoverNode,
  );
  useRegisteredEditorNode(groupRef, index, node, objectsMapRef);

  return (
    <group
      ref={groupRef}
      position={node.position}
      rotation={node.rotation}
      scale={node.scale}
      {...(lockTerrainSelection ? {} : pointerHandlers)}
    >
      <TerrainModel receiveShadow visible />
    </group>
  );
}

function EditorFallbackNode({
  index,
  node,
  isSelected,
  isHovered,
  objectsMapRef,
  onSelectNode,
  onToggleNodeSelection,
  isSelectionLocked,
  onHoverNode,
}: EditorNodeCommonProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointerHandlers = createEditorNodePointerHandlers(
    index,
    onSelectNode,
    onToggleNodeSelection,
    isSelectionLocked,
    onHoverNode,
  );
  useRegisteredEditorNode(meshRef, index, node, objectsMapRef);

  const color = getNodeHighlightColor(isSelected, isHovered) ?? "#6f6f6f";

  return (
    <mesh
      ref={meshRef}
      position={node.position}
      rotation={node.rotation}
      scale={node.scale}
      {...pointerHandlers}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
