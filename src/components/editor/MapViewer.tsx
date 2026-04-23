import { useMemo, useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Grid, TransformControls } from "@react-three/drei";
import * as THREE from "three";

import type { SceneData, MapNode, TransformMode } from "./types";

interface MapViewerProps {
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

const clonedScenesCache = new Map<string, THREE.Group>();

export default function MapViewer({
  sceneData,
  selectedNodeIndex,
  onSelectNode,
  hoveredNodeIndex,
  onHoverNode,
  transformMode,
  onTransformStart,
  onTransformEnd,
  onNodeTransform,
}: MapViewerProps) {
  const isTransforming = useRef(false);
  const objectsRef = useRef<Map<number, THREE.Object3D>>(new Map());

  const handleTransformMouseDown = () => {
    isTransforming.current = true;
    onTransformStart?.();
  };

  const handleTransformMouseUp = () => {
    isTransforming.current = false;
    onTransformEnd?.();

    if (selectedObject && selectedObject.userData?.nodeIndex !== undefined) {
      const index = selectedObject.userData.nodeIndex as number;
      const node = sceneData.mapNodes[index];
      if (node) {
        const updatedNode: MapNode = {
          ...node,
          position: [
            selectedObject.position.x,
            selectedObject.position.y,
            selectedObject.position.z,
          ],
          rotation: [
            selectedObject.rotation.x,
            selectedObject.rotation.y,
            selectedObject.rotation.z,
          ],
          scale: [
            selectedObject.scale.x,
            selectedObject.scale.y,
            selectedObject.scale.z,
          ],
        };
        onNodeTransform?.(index, updatedNode);
      }
    }
  };

  const selectedObject = useMemo(() => {
    if (selectedNodeIndex === null) return null;
    return objectsRef.current.get(selectedNodeIndex) || null;
  }, [selectedNodeIndex]);

  return (
    <>
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#444444"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#666666"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
      <axesHelper args={[10]} />

      <group
onClick={(e) => {
        e.stopPropagation();
        if (!(window as any).isTransforming) {
            onSelectNode(null);
          }
        }}
      >
        {sceneData.mapNodes.map((node, index) => {
          const modelUrl = sceneData.models.get(node.name);

          if (modelUrl) {
            return (
              <ModelNodeWithRef
                key={index}
                index={index}
                node={node}
                modelUrl={modelUrl}
                isSelected={selectedNodeIndex === index}
                isHovered={hoveredNodeIndex === index}
                objectsRef={objectsRef}
                onSelectNode={onSelectNode}
                onHoverNode={onHoverNode}
              />
            );
          } else {
            return (
              <FallbackNodeWithRef
                key={index}
                index={index}
                node={node}
                isSelected={selectedNodeIndex === index}
                isHovered={hoveredNodeIndex === index}
                objectsRef={objectsRef}
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

function ModelNodeWithRef({
  index,
  node,
  modelUrl,
  isSelected,
  isHovered,
  objectsRef,
  onSelectNode,
  onHoverNode,
}: {
  index: number;
  node: MapNode;
  modelUrl: string;
  isSelected: boolean;
  isHovered: boolean;
  objectsRef: React.RefObject<Map<number, THREE.Object3D>>;
  onSelectNode: (index: number | null) => void;
  onHoverNode: (index: number | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelUrl);

  const clonedScene = useMemo(() => {
    if (!clonedScenesCache.has(modelUrl)) {
      const clone = scene.clone(true);
      clonedScenesCache.set(modelUrl, clone);
      return clone;
    }
    return clonedScenesCache.get(modelUrl)!;
  }, [modelUrl, scene]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...node.position);
      groupRef.current.rotation.set(...node.rotation);
      groupRef.current.scale.set(...node.scale);
      groupRef.current.userData = { nodeIndex: index, nodeName: node.name };
      objectsRef.current.set(index, groupRef.current);
    }
    return () => {
      objectsRef.current.delete(index);
    };
  }, [index, node, objectsRef]);

  const instance = useMemo(() => {
    const inst = clonedScene.clone(true);

    if (isSelected) {
      inst.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.set("#ff6600");
        }
      });
    } else if (isHovered) {
      inst.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.set("#ff9900");
        }
      });
    }

    inst.position.set(...node.position);
    inst.rotation.set(...node.rotation);
    inst.scale.set(...node.scale);

    return inst;
  }, [clonedScene, node, isSelected, isHovered]);

  return (
    <primitive
      ref={groupRef}
      object={instance}
      onClick={(e: any) => {
        e.stopPropagation();
        if (!(window as any).isTransforming) {
          onSelectNode(index);
        }
      }}
      onPointerEnter={(e: any) => {
        e.stopPropagation();
        onHoverNode(index);
      }}
      onPointerLeave={(e: any) => {
        e.stopPropagation();
        onHoverNode(null);
      }}
    />
  );
}

function FallbackNodeWithRef({
  index,
  node,
  isSelected,
  isHovered,
  objectsRef,
  onSelectNode,
  onHoverNode,
}: {
  index: number;
  node: MapNode;
  isSelected: boolean;
  isHovered: boolean;
  objectsRef: React.RefObject<Map<number, THREE.Object3D>>;
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
      objectsRef.current.set(index, meshRef.current);
    }
    return () => {
      objectsRef.current.delete(index);
    };
  }, [index, node, objectsRef]);

  const color = isSelected ? "#ff6600" : isHovered ? "#ff9900" : "#cccccc";

  return (
    <mesh
      ref={meshRef}
      position={node.position}
      rotation={node.rotation}
      scale={node.scale}
      onClick={(e) => {
        e.stopPropagation();
        if (!(window as any).isTransforming) {
          onSelectNode(index);
        }
      }}
      onPointerEnter={(e) => {
        e.stopPropagation();
        onHoverNode(index);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        onHoverNode(null);
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
