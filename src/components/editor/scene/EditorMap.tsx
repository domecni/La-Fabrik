import { useRef, useEffect, useState } from "react";
import { Grid, TransformControls } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { TerrainModel } from "@/components/three/world/TerrainModel";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { useTerrainHeightSampler } from "@/hooks/three/useTerrainHeight";
import type { SceneData, MapNode, TransformMode } from "@/types/editor/editor";
import {
  isEditorVisibleMapNode,
  getTerrainMapNode,
} from "@/utils/map/mapRuntimeClassification";

interface EditorMapProps {
  sceneData: SceneData;
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
  isSelectionLocked: boolean;
  hoveredNodeIndex: number | null;
  onHoverNode: (index: number | null) => void;
  transformMode: TransformMode;
  snapToTerrain: boolean;
  lockTerrainSelection: boolean;
  onTransformStart: () => void;
  onTransformEnd: () => void;
  onNodeTransform: (nodeIndex: number, transform: MapNode) => void;
}

type EditorNodeObjectRef = React.RefObject<Map<number, THREE.Object3D>>;

interface EditorNodeCommonProps {
  index: number;
  node: MapNode;
  isSelected: boolean;
  isHovered: boolean;
  objectsMapRef: EditorNodeObjectRef;
  onSelectNode: (index: number | null) => void;
  isSelectionLocked: boolean;
  onHoverNode: (index: number | null) => void;
}

interface EditorNodePointerHandlers {
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  onPointerEnter: (event: ThreeEvent<PointerEvent>) => void;
  onPointerLeave: (event: ThreeEvent<PointerEvent>) => void;
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
  isSelectionLocked: boolean,
  onHoverNode: (index: number | null) => void,
): EditorNodePointerHandlers {
  return {
    onClick: (event) => {
      event.stopPropagation();
      if (isSelectionLocked) return;
      onSelectNode(index);
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
  onSelectNode,
  isSelectionLocked,
  hoveredNodeIndex,
  onHoverNode,
  transformMode,
  snapToTerrain,
  lockTerrainSelection,
  onTransformStart,
  onTransformEnd,
  onNodeTransform,
}: EditorMapProps): React.JSX.Element {
  const objectsMapRef = useRef<Map<number, THREE.Object3D>>(new Map());
  const terrainHeight = useTerrainHeightSampler();

  const handleTransformMouseDown = () => {
    onTransformStart();
  };

  const handleTransformMouseUp = () => {
    syncSelectedObjectTransform();
    onTransformEnd();
  };

  const syncSelectedObjectTransform = () => {
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

  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(
    null,
  );
  const terrainNode = getTerrainMapNode(sceneData.mapNodes);
  const terrainNodeIndex = terrainNode
    ? sceneData.mapNodes.indexOf(terrainNode)
    : -1;
  const selectedNode =
    selectedNodeIndex !== null ? sceneData.mapNodes[selectedNodeIndex] : null;
  const selectedModelName = selectedNode?.name ?? null;

  useEffect(() => {
    if (selectedNodeIndex !== null) {
      const obj = objectsMapRef.current.get(selectedNodeIndex);
      setSelectedObject(obj || null);
    } else {
      setSelectedObject(null);
    }
  }, [selectedNodeIndex]);

  return (
    <>
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#242424"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3a3a3a"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
      <axesHelper args={[10]} />

      <group>
        {terrainNode ? (
          <EditorTerrainNode
            index={terrainNodeIndex}
            node={terrainNode}
            isSelected={selectedNodeIndex === terrainNodeIndex}
            isHovered={hoveredNodeIndex === terrainNodeIndex}
            lockTerrainSelection={lockTerrainSelection}
            objectsMapRef={objectsMapRef}
            onSelectNode={onSelectNode}
            isSelectionLocked={isSelectionLocked}
            onHoverNode={onHoverNode}
          />
        ) : null}
        {sceneData.mapNodes.map((node, index) => {
          if (!isEditorVisibleMapNode(node)) {
            return null;
          }

          if (selectedModelName && node.name !== selectedModelName) {
            return null;
          }

          const modelUrl = sceneData.models.get(node.name);

          if (modelUrl) {
            return (
              <EditorModelNode
                key={index}
                index={index}
                node={node}
                modelUrl={modelUrl}
                isSelected={selectedNodeIndex === index}
                isHovered={hoveredNodeIndex === index}
                objectsMapRef={objectsMapRef}
                onSelectNode={onSelectNode}
                isSelectionLocked={isSelectionLocked}
                onHoverNode={onHoverNode}
              />
            );
          } else {
            return (
              <EditorFallbackNode
                key={index}
                index={index}
                node={node}
                isSelected={selectedNodeIndex === index}
                isHovered={hoveredNodeIndex === index}
                objectsMapRef={objectsMapRef}
                onSelectNode={onSelectNode}
                isSelectionLocked={isSelectionLocked}
                onHoverNode={onHoverNode}
              />
            );
          }
        })}
      </group>

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
  const pointerHandlers = createEditorNodePointerHandlers(
    index,
    onSelectNode,
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
    <primitive
      ref={groupRef}
      object={sceneInstance}
      position={node.position}
      rotation={node.rotation}
      scale={node.scale}
      {...pointerHandlers}
    />
  );
}

function EditorTerrainNode({
  index,
  node,
  lockTerrainSelection,
  objectsMapRef,
  onSelectNode,
  isSelectionLocked,
  onHoverNode,
}: EditorNodeCommonProps & { lockTerrainSelection: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointerHandlers = createEditorNodePointerHandlers(
    index,
    onSelectNode,
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
  isSelectionLocked,
  onHoverNode,
}: EditorNodeCommonProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointerHandlers = createEditorNodePointerHandlers(
    index,
    onSelectNode,
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
