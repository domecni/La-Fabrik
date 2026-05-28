import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { logger } from "@/utils/core/Logger";

interface SkyModelProps {
  fallbackModelScale?: number | undefined;
  fallbackModelPath?: string | undefined;
  modelPath: string;
  fallbackColor?: string | undefined;
  scale?: number | undefined;
}

interface SkyModelContentProps {
  modelPath: string;
  scale: number;
}

interface SkyModelErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  label: string;
  modelPath: string;
}

interface SkyModelErrorBoundaryState {
  hasError: boolean;
}

const SKY_MODEL_SCALE = 1;
const SKY_MODEL_RENDER_ORDER = -1000;
const SKYBOX_MODEL_PATH = "/models/skybox/model.gltf";

class SkyModelErrorBoundary extends Component<
  SkyModelErrorBoundaryProps,
  SkyModelErrorBoundaryState
> {
  constructor(props: SkyModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SkyModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    logger.warn(
      "SkyModel",
      `${this.props.label} model failed; using fallback`,
      {
        error,
        modelPath: this.props.modelPath,
      },
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function SkyModel({
  fallbackColor,
  fallbackModelScale = SKY_MODEL_SCALE,
  fallbackModelPath,
  modelPath,
  scale = SKY_MODEL_SCALE,
}: SkyModelProps): React.JSX.Element {
  const colorFallback = fallbackColor ? (
    <color attach="background" args={[fallbackColor]} />
  ) : null;
  const fallback = fallbackModelPath ? (
    <SkyModelErrorBoundary
      key={fallbackModelPath}
      fallback={colorFallback}
      label="Fallback sky"
      modelPath={fallbackModelPath}
    >
      <SkyModelContent
        modelPath={fallbackModelPath}
        scale={fallbackModelScale}
      />
    </SkyModelErrorBoundary>
  ) : (
    colorFallback
  );

  return (
    <SkyModelErrorBoundary
      key={modelPath}
      fallback={fallback}
      label="Primary sky"
      modelPath={modelPath}
    >
      <SkyModelContent modelPath={modelPath} scale={scale} />
    </SkyModelErrorBoundary>
  );
}

function SkyModelContent({
  modelPath,
  scale,
}: SkyModelContentProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useLoggedGLTF(modelPath, {
    scope: "SkyModel",
    scale,
  });
  const model = useMemo(() => createSkyModel(scene), [scene]);

  useEffect(() => {
    return () => {
      disposeSkyModelMaterials(model);
    };
  }, [model]);

  useFrame(() => {
    groupRef.current?.position.copy(camera.position);
  });

  return (
    <group
      ref={groupRef}
      renderOrder={SKY_MODEL_RENDER_ORDER}
      scale={scale}
      frustumCulled={false}
    >
      <primitive object={model} />
    </group>
  );
}

function createSkyModel(scene: THREE.Object3D): THREE.Object3D {
  const model = scene.clone(true);

  model.traverse((object) => {
    object.frustumCulled = false;
    object.renderOrder = SKY_MODEL_RENDER_ORDER;

    if (!(object instanceof THREE.Mesh)) return;

    object.material = Array.isArray(object.material)
      ? object.material.map(createSkyMaterial)
      : createSkyMaterial(object.material);
  });

  return model;
}

function createSkyMaterial<T extends THREE.Material>(material: T): T {
  const skyMaterial = material.clone();
  skyMaterial.side = THREE.BackSide;
  skyMaterial.depthTest = false;
  skyMaterial.depthWrite = false;

  return skyMaterial as T;
}

function disposeSkyModelMaterials(model: THREE.Object3D): void {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    if (Array.isArray(object.material)) {
      for (const material of object.material) {
        material.dispose();
      }
      return;
    }

    object.material.dispose();
  });
}

useGLTF.preload(SKYBOX_MODEL_PATH);
