import type { ReactNode } from "react";
import { Component, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { ExplodedModel } from "@/utils/three/ExplodedModel";
import type { Vector3Tuple } from "@/types/three/three";

interface ModelErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<
  ModelErrorBoundaryProps,
  ModelErrorBoundaryState
> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.warn("Failed to load explodable model", error);
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

interface ExplodableModelInnerProps {
  modelPath: string;
  split: boolean;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number | Vector3Tuple;
  splitDistance?: number;
}

export function ExplodableModel(
  props: ExplodableModelInnerProps,
): React.JSX.Element {
  return (
    <ModelErrorBoundary
      key={props.modelPath}
      fallback={<MissingModelFallback position={props.position ?? [0, 0, 0]} />}
    >
      <ExplodableModelInner {...props} />
    </ModelErrorBoundary>
  );
}

function ExplodableModelInner({
  modelPath,
  split,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  splitDistance = 1.2,
}: ExplodableModelInnerProps): React.JSX.Element {
  const { scene } = useGLTF(modelPath);
  const model = useMemo(() => scene.clone(true), [scene]);
  const explodedModel = useMemo(
    () => new ExplodedModel(model, { distance: splitDistance }),
    [model, splitDistance],
  );
  const parsedScale =
    typeof scale === "number" ? ([scale, scale, scale] as Vector3Tuple) : scale;

  useEffect(() => {
    explodedModel.setSplit(split);
  }, [explodedModel, split]);

  useFrame((_, delta) => {
    explodedModel.update(delta);
  });

  return (
    <group position={position} rotation={rotation} scale={parsedScale}>
      <primitive object={model} />
    </group>
  );
}

function MissingModelFallback({
  position = [0, 0, 0],
}: {
  position?: Vector3Tuple;
}): React.JSX.Element {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial color="#7f1d1d" wireframe />
    </mesh>
  );
}
