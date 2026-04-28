import { useMemo, useRef, useEffect, useState } from "react";
import { Grid, TransformControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

import type { SceneData, MapNode, TransformMode } from "@/types/editor";

interface EditorMapProps {
  sceneData: SceneData;
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
  hoveredNodeIndex: number | null;
  onHoverNode: (index: number | null) => void;
  transformMode: TransformMode;
  onTransformStart: () => void;
  onTransformEnd: () => void;
  onNodeTransform: (nodeIndex: number, transform: MapNode) => void;
}

export function EditorMap({
  sceneData,
  selectedNodeIndex,
  onSelectNode,
  hoveredNodeIndex,
  onHoverNode,
  transformMode,
  onTransformStart,
  onTransformEnd,
  onNodeTransform,
}: EditorMapProps): React.JSX.Element {
  const objectsMapRef = useRef<Map<number, THREE.Object3D>>(new Map());

  const handleTransformMouseDown = () => {
    onTransformStart?.();
  };

  const handleTransformMouseUp = () => {
    if (selectedNodeIndex !== null) {
      const obj = objectsMapRef.current.get(selectedNodeIndex);
      if (!obj) return;
      const node = sceneData.mapNodes[selectedNodeIndex];
      if (node) {
        const updatedNode: MapNode = {
          ...node,
          position: [obj.position.x, obj.position.y, obj.position.z],
          rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
          scale: [obj.scale.x, obj.scale.y, obj.scale.z],
        };
        onNodeTransform?.(selectedNodeIndex, updatedNode);
      }
    }
    onTransformEnd?.();
  };

  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(
    null,
  );

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

      <group
        onClick={(e: unknown) => {
          (e as { stopPropagation?: () => void }).stopPropagation?.();
          onSelectNode(null);
        }}
      >
        {sceneData.mapNodes.map((node, index) => {
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
  onHoverNode,
}: {
  index: number;
  node: MapNode;
  modelUrl: string;
  isSelected: boolean;
  isHovered: boolean;
  objectsMapRef: React.RefObject<Map<number, THREE.Object3D>>;
  onSelectNode: (index: number | null) => void;
  onHoverNode: (index: number | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelUrl);

  const sceneInstance = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...node.position);
      groupRef.current.rotation.set(...node.rotation);
      groupRef.current.scale.set(...node.scale);
      groupRef.current.userData = { nodeIndex: index, nodeName: node.name };
      objectsMapRef.current.set(index, groupRef.current);
    }
    const currentMap = objectsMapRef.current;
    const currentIndex = index;
    return () => {
      currentMap.delete(currentIndex);
    };
  }, [
    index,
    node.name,
    node.position,
    node.rotation,
    node.scale,
    objectsMapRef,
  ]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...node.position);
      groupRef.current.rotation.set(...node.rotation);
      groupRef.current.scale.set(...node.scale);
    }
  }, [node.position, node.rotation, node.scale]);

  useEffect(() => {
    if (!groupRef.current) return;

    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (
          mesh.material &&
          mesh.material instanceof THREE.MeshStandardMaterial
        ) {
          if (isSelected) {
            mesh.material = mesh.material.clone();
            (mesh.material as THREE.MeshStandardMaterial).color.set("#ffffff");
          } else if (isHovered) {
            mesh.material = mesh.material.clone();
            (mesh.material as THREE.MeshStandardMaterial).color.set("#b8b8b8");
          }
        }
      }
    });
  }, [isSelected, isHovered]);

  return (
    <primitive
      ref={groupRef}
      object={sceneInstance}
      position={node.position}
      rotation={node.rotation}
      scale={node.scale}
      onClick={(e: unknown) => {
        (e as { stopPropagation?: () => void }).stopPropagation?.();
        onSelectNode(index);
      }}
      onPointerEnter={(e: unknown) => {
        (e as { stopPropagation?: () => void }).stopPropagation?.();
        onHoverNode(index);
      }}
      onPointerLeave={(e: unknown) => {
        (e as { stopPropagation?: () => void }).stopPropagation?.();
        onHoverNode(null);
      }}
    />
  );
}

function EditorFallbackNode({
  index,
  node,
  isSelected,
  isHovered,
  objectsMapRef,
  onSelectNode,
  onHoverNode,
}: {
  index: number;
  node: MapNode;
  isSelected: boolean;
  isHovered: boolean;
  objectsMapRef: React.RefObject<Map<number, THREE.Object3D>>;
  onSelectNode: (index: number | null) => void;
  onHoverNode: (index: number | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...node.position);
      meshRef.current.rotation.set(...node.rotation);
      meshRef.current.scale.set(...node.scale);
      meshRef.current.userData = { nodeIndex: index, nodeName: node.name };
      objectsMapRef.current.set(index, meshRef.current);
    }
    const currentMap = objectsMapRef.current;
    const currentIndex = index;
    return () => {
      currentMap.delete(currentIndex);
    };
  }, [
    index,
    node.name,
    node.position,
    node.rotation,
    node.scale,
    objectsMapRef,
  ]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...node.position);
      meshRef.current.rotation.set(...node.rotation);
      meshRef.current.scale.set(...node.scale);
    }
  }, [node.position, node.rotation, node.scale]);

  const color = isSelected ? "#ffffff" : isHovered ? "#b8b8b8" : "#6f6f6f";

  return (
    <mesh
      ref={meshRef}
      position={node.position}
      rotation={node.rotation}
      scale={node.scale}
      onClick={(e: unknown) => {
        (e as { stopPropagation?: () => void }).stopPropagation?.();
        onSelectNode(index);
      }}
      onPointerEnter={(e: unknown) => {
        (e as { stopPropagation?: () => void }).stopPropagation?.();
        onHoverNode(index);
      }}
      onPointerLeave={(e: unknown) => {
        (e as { stopPropagation?: () => void }).stopPropagation?.();
        onHoverNode(null);
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
