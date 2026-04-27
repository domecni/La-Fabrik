import {
  useEffect,
  useState,
  useMemo,
  useRef,
  Suspense,
  Component,
  type ReactNode,
} from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useOctreeGraphNode } from "@/hooks/useOctreeGraphNode";
import type { OctreeReadyHandler } from "@/types/3d";

interface MapNode {
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

const MAP_JSON_PATH = "/map.json";

const clonedScenesCache = new Map<string, THREE.Group>();

class GameMapErrorBoundary extends Component<
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
    console.warn("GameMap model loading error:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

interface GameMapProps {
  onOctreeReady: OctreeReadyHandler;
}

export function GameMap({ onOctreeReady }: GameMapProps): React.JSX.Element {
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
  const [availableModels, setAvailableModels] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const groupRef = useRef<THREE.Group>(null);

  useOctreeGraphNode(groupRef, onOctreeReady);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const nodesResponse = await fetch(MAP_JSON_PATH);
        if (!nodesResponse.ok) {
          console.warn("map.json not found");
          setIsLoading(false);
          return;
        }

        const nodes: MapNode[] = await nodesResponse.json();
        setMapNodes(nodes);

        const uniqueModelNames = [...new Set(nodes.map((n) => n.name))];
        const available = new Set<string>();

        for (const modelName of uniqueModelNames) {
          try {
            const modelUrl = `/models/${modelName}/model.gltf`;
            const modelResponse = await fetch(modelUrl);
            const contentType = modelResponse.headers.get("content-type") || "";
            if (contentType.includes("gltf") || contentType.includes("model")) {
              available.add(modelName);
            }
          } catch {
            /* empty */
          }
        }
        setAvailableModels(available);
      } catch (error) {
        console.error("Error loading map:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, []);

  const nodesToRender = useMemo(() => {
    return mapNodes.filter((node) => availableModels.has(node.name));
  }, [mapNodes, availableModels]);

  if (isLoading) {
    return <></>;
  }

  return (
    <group ref={groupRef}>
      {nodesToRender.map((node, index) => (
        <GameMapErrorBoundary key={index} fallback={null}>
          <Suspense fallback={null}>
            <ModelInstance node={node} />
          </Suspense>
        </GameMapErrorBoundary>
      ))}
    </group>
  );
}

function ModelInstance({ node }: { node: MapNode }): React.JSX.Element {
  const modelPath = `/models/${node.name}/model.gltf`;
  const { scene } = useGLTF(modelPath);

  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => {
    if (!clonedScenesCache.has(modelPath)) {
      const clone = scene.clone(true);
      clonedScenesCache.set(modelPath, clone);
      return clone;
    }
    return clonedScenesCache.get(modelPath)!;
  }, [modelPath, scene]);

  const instance = useMemo(() => {
    const inst = clonedScene.clone(true);
    inst.position.set(...node.position);
    inst.rotation.set(...node.rotation);
    inst.scale.set(...node.scale);
    return inst;
  }, [clonedScene, node.position, node.rotation, node.scale]);

  return <primitive ref={groupRef} object={instance} />;
}
