import {
  useMemo,
  useRef,
  useEffect,
  useState,
  Suspense,
  Component,
  type ReactNode,
} from "react";
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

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo): void {
    console.warn("Model loading error:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

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
}: MapViewerProps): React.JSX.Element {
  const isTransforming = useRef(false);
  const objectsMapRef = useRef<Map<number, THREE.Object3D>>(new Map());

  const handleTransformMouseDown = () => {
    isTransforming.current = true;
    onTransformStart?.();
  };

  const handleTransformMouseUp = () => {
    isTransforming.current = false;

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
        onClick={(e: unknown) => {
          (e as { stopPropagation?: () => void }).stopPropagation?.();
          onSelectNode(null);
        }}
      >
        {sceneData.mapNodes.map((node, index) => {
          const modelUrl = sceneData.models.get(node.name);

          if (modelUrl) {
            return (
              <ErrorBoundary key={index} fallback={null}>
                <Suspense fallback={null}>
                  <ModelNodeWithRef
                    index={index}
                    node={node}
                    modelUrl={modelUrl}
                    isSelected={selectedNodeIndex === index}
                    isHovered={hoveredNodeIndex === index}
                    objectsMapRef={objectsMapRef}
                    onSelectNode={onSelectNode}
                    onHoverNode={onHoverNode}
                  />
                </Suspense>
              </ErrorBoundary>
            );
          } else {
            return (
              <FallbackNodeWithRef
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

function ModelNodeWithRef({
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
      objectsMapRef.current.set(index, groupRef.current);
    }
    const currentMap = objectsMapRef.current;
    const currentIndex = index;
    return () => {
      currentMap.delete(currentIndex);
    };
  }, [index, node, objectsMapRef]);

  const instance = useMemo(() => {
    const inst = clonedScene.clone(true);

    if (isSelected) {
      inst.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as unknown as THREE.MeshStandardMaterial;
          mesh.material = mat.clone();
          (mesh.material as unknown as THREE.MeshStandardMaterial).color.set(
            "#ff6600",
          );
        }
      });
    } else if (isHovered) {
      inst.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as unknown as THREE.MeshStandardMaterial;
          mesh.material = mat.clone();
          (mesh.material as unknown as THREE.MeshStandardMaterial).color.set(
            "#ff9900",
          );
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

function FallbackNodeWithRef({
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
  }, [index, node, objectsMapRef]);

  const color = isSelected ? "#ff6600" : isHovered ? "#ff9900" : "#cccccc";

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
