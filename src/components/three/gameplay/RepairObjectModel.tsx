import type { ReactNode } from "react";
import { Component } from "react";
import { SimpleModel } from "@/components/three/models/SimpleModel";
import type { ModelTransformProps } from "@/types/three/three";
import { logModelLoadError } from "@/utils/three/modelLoadLogger";

interface RepairObjectModelProps extends ModelTransformProps {
  label: string;
  modelPath: string;
}

interface RepairObjectModelBoundaryProps extends RepairObjectModelProps {
  children: ReactNode;
}

interface RepairObjectModelBoundaryState {
  hasError: boolean;
}

class RepairObjectModelBoundary extends Component<
  RepairObjectModelBoundaryProps,
  RepairObjectModelBoundaryState
> {
  constructor(props: RepairObjectModelBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): RepairObjectModelBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    logModelLoadError(
      {
        modelPath: this.props.modelPath,
        position: this.props.position,
        rotation: this.props.rotation,
        scale: this.props.scale,
        scope: `RepairObjectModel.${this.props.label}`,
      },
      error,
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <RepairObjectFallback label={this.props.label} />;
    }

    return this.props.children;
  }
}

export function RepairObjectModel({
  label,
  modelPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: RepairObjectModelProps): React.JSX.Element {
  return (
    <RepairObjectModelBoundary
      label={label}
      modelPath={modelPath}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <SimpleModel
        modelPath={modelPath}
        position={position}
        rotation={rotation}
        scale={scale}
      />
    </RepairObjectModelBoundary>
  );
}

function RepairObjectFallback({ label }: { label: string }): React.JSX.Element {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshStandardMaterial color="#facc15" roughness={0.6} wireframe />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={label ? "#f8fafc" : "#facc15"} />
      </mesh>
    </group>
  );
}
