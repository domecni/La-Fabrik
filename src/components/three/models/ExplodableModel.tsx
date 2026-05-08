import type { ReactNode } from "react";
import { Component, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { ExplodedModel } from "@/utils/three/ExplodedModel";
import type { ExplodedPart } from "@/utils/three/ExplodedModel";
import type { ModelTransformProps, Vector3Tuple } from "@/types/three/three";
import { logModelLoadError } from "@/utils/three/modelLoadLogger";
import { toVector3Scale } from "@/utils/three/scale";

interface ModelErrorBoundaryProps {
  children: ReactNode;
  modelPath: string;
  position?: Vector3Tuple | undefined;
  rotation?: Vector3Tuple | undefined;
  scale?: ModelTransformProps["scale"] | undefined;
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
    logModelLoadError(
      {
        modelPath: this.props.modelPath,
        scope: "ExplodableModel",
        position: this.props.position,
        rotation: this.props.rotation,
        scale: this.props.scale,
      },
      error,
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <MissingModelFallback
          position={this.props.position}
          rotation={this.props.rotation}
          scale={this.props.scale}
        />
      );
    }

    return this.props.children;
  }
}

interface ExplodableModelInnerProps extends ModelTransformProps {
  modelPath: string;
  split: boolean;
  splitDistance?: number;
  onPartsReady?: (parts: readonly ExplodedPart[]) => void;
}

export function ExplodableModel(
  props: ExplodableModelInnerProps,
): React.JSX.Element {
  return (
    <ModelErrorBoundary
      key={props.modelPath}
      modelPath={props.modelPath}
      position={props.position}
      rotation={props.rotation}
      scale={props.scale}
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
  onPartsReady,
}: ExplodableModelInnerProps): React.JSX.Element {
  const { scene } = useLoggedGLTF(modelPath, {
    scope: "ExplodableModel",
    position,
    rotation,
    scale,
  });
  const model = useClonedObject(scene);
  const explodedModel = useMemo(
    () => new ExplodedModel(model, { distance: splitDistance }),
    [model, splitDistance],
  );
  const parsedScale = toVector3Scale(scale);

  useEffect(() => {
    explodedModel.setSplit(split);
  }, [explodedModel, split]);

  useEffect(() => {
    onPartsReady?.(explodedModel.getParts());
  }, [explodedModel, onPartsReady]);

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
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position?: Vector3Tuple | undefined;
  rotation?: Vector3Tuple | undefined;
  scale?: ModelTransformProps["scale"] | undefined;
}): React.JSX.Element {
  return (
    <mesh position={position} rotation={rotation} scale={toVector3Scale(scale)}>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial color="#7f1d1d" wireframe />
    </mesh>
  );
}
