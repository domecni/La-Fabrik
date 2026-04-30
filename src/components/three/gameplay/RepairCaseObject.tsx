import type { ReactNode } from "react";
import { Component } from "react";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import { RepairCaseModel } from "@/components/three/gameplay/RepairCaseModel";
import {
  REPAIR_CASE_MODEL_PATH,
  REPAIR_CASE_OPEN_SOUND_PATH,
} from "@/data/gameplay/repairCaseConfig";
import { AudioManager } from "@/managers/AudioManager";
import type { Vector3Tuple } from "@/types/three/three";

interface RepairCaseErrorBoundaryProps {
  children: ReactNode;
}

interface RepairCaseErrorBoundaryState {
  hasError: boolean;
}

class RepairCaseErrorBoundary extends Component<
  RepairCaseErrorBoundaryProps,
  RepairCaseErrorBoundaryState
> {
  constructor(props: RepairCaseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): RepairCaseErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.warn("Failed to load repair case model", error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <RepairCaseFallback />;
    }

    return this.props.children;
  }
}

interface RepairCaseObjectProps {
  position: Vector3Tuple;
  open: boolean;
  onInspect: () => void;
}

export function RepairCaseObject({
  position,
  open,
  onInspect,
}: RepairCaseObjectProps): React.JSX.Element {
  return (
    <TriggerObject
      position={position}
      colliders="cuboid"
      label={open ? "Mallette inspectée" : "Inspecter la mallette"}
      onTrigger={() => {
        if (open) return;
        AudioManager.getInstance().playSound(REPAIR_CASE_OPEN_SOUND_PATH);
        onInspect();
      }}
    >
      <RepairCaseErrorBoundary>
        <RepairCaseModel
          modelPath={REPAIR_CASE_MODEL_PATH}
          open={open}
          position={[0, -0.45, 0]}
          scale={1.5}
        />
      </RepairCaseErrorBoundary>
    </TriggerObject>
  );
}

function RepairCaseFallback(): React.JSX.Element {
  return (
    <group position={[0, -0.25, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.5, 1]} />
        <meshStandardMaterial color="#2563eb" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.35, -0.25]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.12, 0.65]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.55} />
      </mesh>
    </group>
  );
}
