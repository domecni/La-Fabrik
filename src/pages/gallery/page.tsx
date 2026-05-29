import {
  Bounds,
  Center,
  Html,
  OrbitControls,
  useAnimations,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import * as THREE from "three";
import { SkyModel } from "@/components/three/world/SkyModel";
import { galleryModels, type GalleryModel } from "@/data/galleryModels";
import {
  AMBIENT_INTENSITY_MAX,
  AMBIENT_INTENSITY_MIN,
  AMBIENT_INTENSITY_STEP,
  AMBIENT_LIGHT_COLOR,
  LIGHTING_DEFAULTS,
  SUN_INTENSITY_MAX,
  SUN_INTENSITY_MIN,
  SUN_INTENSITY_STEP,
  SUN_LIGHT_COLOR,
  SUN_X_MAX,
  SUN_X_MIN,
  SUN_X_STEP,
  SUN_Y_MAX,
  SUN_Y_MIN,
  SUN_Y_STEP,
  SUN_Z_MAX,
  SUN_Z_MIN,
  SUN_Z_STEP,
} from "@/data/world/lightingConfig";
import {
  GAME_SCENE_FALLBACK_SKY_MODEL_PATH,
  GAME_SCENE_FALLBACK_SKY_MODEL_SCALE,
  GAME_SCENE_SKY_MODEL_PATH,
  GAME_SCENE_SKY_MODEL_SCALE,
} from "@/data/world/environmentConfig";

interface GalleryModelProps {
  model: GalleryModel;
}

interface GallerySceneProps extends GalleryModelProps {
  lighting: GalleryLightingConfig;
  onTextureDiagnosticReady: (diagnostic: TextureDiagnostic) => void;
}

interface GalleryModelPreviewProps extends GalleryModelProps {
  onTextureDiagnosticReady: (diagnostic: TextureDiagnostic) => void;
}

interface GalleryLightingConfig {
  ambientIntensity: number;
  sunIntensity: number;
  sunX: number;
  sunY: number;
  sunZ: number;
}

interface GalleryLightControl {
  key: keyof GalleryLightingConfig;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface TextureDiagnostic {
  modelId: string | null;
  status: "loading" | "ok" | "warning";
  summary: string;
}

interface GalleryModelScene extends THREE.Object3D {
  userData: THREE.Object3D["userData"] & {
    hiddenExportPlaneCount?: number;
  };
}

interface GalleryViewerErrorBoundaryProps {
  children: ReactNode;
  resetKey: string;
}

interface GalleryViewerErrorBoundaryState {
  hasError: boolean;
}

const TEXTURE_SLOTS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "aoMap",
  "emissiveMap",
  "alphaMap",
] as const;

const LOADING_TEXTURE_DIAGNOSTIC: TextureDiagnostic = {
  modelId: null,
  status: "loading",
  summary: "Analyse des textures...",
};

const GALLERY_LIGHT_CONTROLS: GalleryLightControl[] = [
  {
    key: "ambientIntensity",
    label: "Ambiance",
    min: AMBIENT_INTENSITY_MIN,
    max: AMBIENT_INTENSITY_MAX,
    step: AMBIENT_INTENSITY_STEP,
  },
  {
    key: "sunIntensity",
    label: "Soleil",
    min: SUN_INTENSITY_MIN,
    max: SUN_INTENSITY_MAX,
    step: SUN_INTENSITY_STEP,
  },
  {
    key: "sunX",
    label: "Soleil X",
    min: SUN_X_MIN,
    max: SUN_X_MAX,
    step: SUN_X_STEP,
  },
  {
    key: "sunY",
    label: "Soleil Y",
    min: SUN_Y_MIN,
    max: SUN_Y_MAX,
    step: SUN_Y_STEP,
  },
  {
    key: "sunZ",
    label: "Soleil Z",
    min: SUN_Z_MIN,
    max: SUN_Z_MAX,
    step: SUN_Z_STEP,
  },
];

function GalleryLoadingIndicator(): React.JSX.Element {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="gallery-loading">
        <Loader2
          className="gallery-loading-spinner"
          size={32}
          strokeWidth={2}
        />
        <span className="gallery-loading-text">
          {progress < 100 ? `${Math.round(progress)}%` : "Préparation..."}
        </span>
      </div>
    </Html>
  );
}

class GalleryViewerErrorBoundary extends Component<
  GalleryViewerErrorBoundaryProps,
  GalleryViewerErrorBoundaryState
> {
  constructor(props: GalleryViewerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): GalleryViewerErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(previousProps: GalleryViewerErrorBoundaryProps): void {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="gallery-viewer-error" role="status">
          <TriangleAlert size={24} strokeWidth={1.8} />
          <span>Ce modèle ne peut pas être affiché pour le moment.</span>
        </div>
      );
    }

    return this.props.children;
  }
}

function GalleryModelPreview({
  model,
  onTextureDiagnosticReady,
}: GalleryModelPreviewProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const { animations, scene } = useGLTF(model.path);
  const modelScene = useMemo(() => createGalleryModelScene(scene), [scene]);
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    return () => {
      disposeGalleryModelMaterials(modelScene);
    };
  }, [modelScene]);

  useEffect(() => {
    onTextureDiagnosticReady(getTextureDiagnostic(model.id, modelScene));
  }, [model.id, modelScene, onTextureDiagnosticReady]);

  useEffect(() => {
    const animationActions = Object.values(actions).filter(
      (action): action is THREE.AnimationAction => Boolean(action),
    );

    for (const action of animationActions) {
      action.reset().play();
    }

    return () => {
      for (const action of animationActions) {
        action.stop();
      }
    };
  }, [actions]);

  return (
    <group ref={groupRef}>
      <primitive object={modelScene} />
    </group>
  );
}

function createGalleryModelScene(scene: THREE.Object3D): THREE.Object3D {
  const modelScene = scene.clone(true) as GalleryModelScene;
  const exportPlaneMeshes: THREE.Mesh[] = [];

  modelScene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    if (isExportPlaneMesh(object)) {
      exportPlaneMeshes.push(object);
      return;
    }

    object.material = Array.isArray(object.material)
      ? object.material.map(createGalleryMaterial)
      : createGalleryMaterial(object.material);
  });

  for (const mesh of exportPlaneMeshes) {
    mesh.parent?.remove(mesh);
  }

  modelScene.userData.hiddenExportPlaneCount = exportPlaneMeshes.length;

  return modelScene;
}

function isExportPlaneMesh(mesh: THREE.Mesh): boolean {
  const name = mesh.name.toLowerCase();
  if (name !== "plan" && name !== "plane") return false;

  mesh.geometry.computeBoundingBox();
  const boundingBox = mesh.geometry.boundingBox;
  if (!boundingBox) return false;

  const size = new THREE.Vector3();
  boundingBox.getSize(size);

  const dimensions = [size.x, size.y, size.z];
  const flatDimensions = dimensions.filter((dimension) => dimension <= 0.001);
  const largestDimension = Math.max(...dimensions);

  return flatDimensions.length > 0 && largestDimension > 1;
}

function createGalleryMaterial(material: THREE.Material): THREE.Material {
  const galleryMaterial = material.clone();
  const materialWithNormalMap = galleryMaterial as THREE.Material & {
    normalMap?: THREE.Texture | null;
  };

  galleryMaterial.side = THREE.DoubleSide;

  if (materialWithNormalMap.normalMap) {
    materialWithNormalMap.normalMap = null;
    galleryMaterial.needsUpdate = true;
  }

  return galleryMaterial;
}

function disposeGalleryModelMaterials(modelScene: THREE.Object3D): void {
  modelScene.traverse((object) => {
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

function GalleryScene({
  lighting,
  model,
  onTextureDiagnosticReady,
}: GallerySceneProps): React.JSX.Element {
  return (
    <>
      <SkyModel
        fallbackModelPath={GAME_SCENE_FALLBACK_SKY_MODEL_PATH}
        fallbackScale={GAME_SCENE_FALLBACK_SKY_MODEL_SCALE}
        materialSide={THREE.DoubleSide}
        modelPath={GAME_SCENE_SKY_MODEL_PATH}
        scale={GAME_SCENE_SKY_MODEL_SCALE}
        unlit
      />
      <GalleryLighting lighting={lighting} />
      <Bounds fit clip observe margin={1.35}>
        <Center>
          <GalleryModelPreview
            model={model}
            onTextureDiagnosticReady={onTextureDiagnosticReady}
          />
        </Center>
      </Bounds>
      <OrbitControls
        makeDefault
        enableDamping
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
    </>
  );
}

function GalleryLighting({
  lighting,
}: {
  lighting: GalleryLightingConfig;
}): React.JSX.Element {
  return (
    <>
      <ambientLight
        intensity={lighting.ambientIntensity}
        color={AMBIENT_LIGHT_COLOR}
      />
      <directionalLight
        position={[lighting.sunX, lighting.sunY, lighting.sunZ]}
        intensity={lighting.sunIntensity}
        color={SUN_LIGHT_COLOR}
      />
    </>
  );
}

function TextureStatusBadge({
  diagnostic,
}: {
  diagnostic: TextureDiagnostic;
}): React.JSX.Element {
  const isLoading = diagnostic.status === "loading";
  const hasWarning = diagnostic.status === "warning";

  if (isLoading) {
    return (
      <div className="gallery-texture-status gallery-texture-status--loading">
        <Loader2
          className="gallery-texture-status-spinner"
          aria-hidden="true"
          size={14}
          strokeWidth={2.2}
        />
        <span>{diagnostic.summary}</span>
      </div>
    );
  }

  const Icon = hasWarning ? TriangleAlert : CheckCircle2;

  return (
    <div
      className={`gallery-texture-status gallery-texture-status--${diagnostic.status}`}
    >
      <Icon aria-hidden="true" size={15} strokeWidth={2.1} />
      <span>{diagnostic.summary}</span>
    </div>
  );
}

function GalleryLightingPanel({
  lighting,
  onChange,
  onReset,
  onToggle,
  open,
}: {
  lighting: GalleryLightingConfig;
  onChange: (key: keyof GalleryLightingConfig, value: number) => void;
  onReset: () => void;
  onToggle: () => void;
  open: boolean;
}): React.JSX.Element {
  return (
    <aside className={`gallery-light-panel ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="gallery-light-panel-toggle"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={
          open ? "Fermer les réglages lumière" : "Ouvrir les réglages lumière"
        }
      >
        <SlidersHorizontal aria-hidden="true" size={18} strokeWidth={1.8} />
      </button>
      <div className="gallery-light-panel-content" aria-hidden={!open}>
        <header>
          <span>LIGHTS</span>
          <button type="button" onClick={onReset}>
            Reset
          </button>
        </header>
        {GALLERY_LIGHT_CONTROLS.map((control) => (
          <label key={control.key} className="gallery-light-control">
            <span>
              {control.label}
              <strong>{lighting[control.key].toFixed(1)}</strong>
            </span>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={lighting[control.key]}
              onChange={(event) =>
                onChange(control.key, Number(event.currentTarget.value))
              }
            />
          </label>
        ))}
      </div>
    </aside>
  );
}

function GalleryEmptyState(): React.JSX.Element {
  return (
    <main className="gallery-page gallery-page--empty">
      <div className="gallery-empty-state">
        <TriangleAlert size={48} strokeWidth={1.5} />
        <h1>Aucun modèle disponible</h1>
        <p>La galerie ne contient aucun modèle à afficher pour le moment.</p>
      </div>
    </main>
  );
}

function getTextureDiagnostic(
  modelId: string,
  modelScene: THREE.Object3D,
): TextureDiagnostic {
  let textureCount = 0;
  let missingTextureImageCount = 0;
  const hiddenExportPlaneCount =
    (modelScene as GalleryModelScene).userData.hiddenExportPlaneCount ?? 0;

  modelScene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      const materialRecord = material as unknown as Record<string, unknown>;

      for (const textureSlot of TEXTURE_SLOTS) {
        const texture = materialRecord[textureSlot];
        if (!(texture instanceof THREE.Texture)) continue;

        textureCount += 1;

        if (!texture.image) {
          missingTextureImageCount += 1;
        }
      }
    }
  });

  if (missingTextureImageCount > 0) {
    return {
      modelId,
      status: "warning",
      summary: `${missingTextureImageCount} texture(s) à vérifier`,
    };
  }

  if (hiddenExportPlaneCount > 0) {
    return {
      modelId,
      status: "warning",
      summary: `${hiddenExportPlaneCount} plan(s) d'export masqué(s)`,
    };
  }

  if (textureCount === 0) {
    return {
      modelId,
      status: "warning",
      summary: "Aucune texture détectée",
    };
  }

  return {
    modelId,
    status: "ok",
    summary: `${textureCount} texture(s) OK`,
  };
}

export function GalleryPage(): React.JSX.Element {
  const [activeModelIndex, setActiveModelIndex] = useState(0);
  const [lightPanelOpen, setLightPanelOpen] = useState(false);
  const [lighting, setLighting] = useState<GalleryLightingConfig>({
    ...LIGHTING_DEFAULTS,
  });
  const [textureDiagnostic, setTextureDiagnostic] = useState<TextureDiagnostic>(
    LOADING_TEXTURE_DIAGNOSTIC,
  );

  const modelCount = galleryModels.length;
  const activeModel = galleryModels[activeModelIndex] ?? galleryModels[0];

  const activeTextureDiagnostic =
    activeModel && textureDiagnostic.modelId === activeModel.id
      ? textureDiagnostic
      : LOADING_TEXTURE_DIAGNOSTIC;

  // Preload adjacent models for smoother navigation
  useEffect(() => {
    if (modelCount <= 1) return;

    const prevIndex =
      activeModelIndex === 0 ? modelCount - 1 : activeModelIndex - 1;
    const nextIndex =
      activeModelIndex === modelCount - 1 ? 0 : activeModelIndex + 1;

    const prevModel = galleryModels[prevIndex];
    const nextModel = galleryModels[nextIndex];

    if (prevModel) {
      useGLTF.preload(prevModel.path);
    }
    if (nextModel) {
      useGLTF.preload(nextModel.path);
    }
  }, [activeModelIndex, modelCount]);

  // Memoized callbacks to prevent unnecessary re-renders
  const goToPreviousModel = useCallback((): void => {
    setActiveModelIndex((currentIndex) =>
      currentIndex === 0 ? modelCount - 1 : currentIndex - 1,
    );
  }, [modelCount]);

  const goToNextModel = useCallback((): void => {
    setActiveModelIndex((currentIndex) =>
      currentIndex === modelCount - 1 ? 0 : currentIndex + 1,
    );
  }, [modelCount]);

  const handleLightChange = useCallback(
    (key: keyof GalleryLightingConfig, value: number): void => {
      setLighting((currentLighting) => ({
        ...currentLighting,
        [key]: value,
      }));
    },
    [],
  );

  const resetLighting = useCallback((): void => {
    setLighting({ ...LIGHTING_DEFAULTS });
  }, []);

  const toggleLightPanel = useCallback((): void => {
    setLightPanelOpen((open) => !open);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goToPreviousModel();
          break;
        case "ArrowRight":
          event.preventDefault();
          goToNextModel();
          break;
        case "l":
        case "L":
          event.preventDefault();
          toggleLightPanel();
          break;
        case "r":
        case "R":
          if (!lightPanelOpen) return;
          event.preventDefault();
          resetLighting();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    goToPreviousModel,
    goToNextModel,
    toggleLightPanel,
    resetLighting,
    lightPanelOpen,
  ]);

  // Guard against empty gallery (after all hooks)
  if (modelCount === 0 || !activeModel) {
    return <GalleryEmptyState />;
  }

  return (
    <main className="gallery-page">
      <h1 className="gallery-title">GALERIE</h1>

      <div className="gallery-canvas-frame" aria-label="Viewer 3D">
        <GalleryViewerErrorBoundary resetKey={activeModel.id}>
          <Canvas camera={{ position: [3.5, 2.4, 4.5], fov: 45 }} dpr={[1, 2]}>
            <Suspense fallback={<GalleryLoadingIndicator />}>
              <GalleryScene
                lighting={lighting}
                model={activeModel}
                onTextureDiagnosticReady={setTextureDiagnostic}
              />
            </Suspense>
          </Canvas>
        </GalleryViewerErrorBoundary>
      </div>

      <nav className="gallery-bottom-bar" aria-label="Navigation des modèles">
        <button
          type="button"
          className="gallery-nav-button"
          onClick={goToPreviousModel}
          aria-label="Modèle précédent (flèche gauche)"
        >
          <ArrowLeft aria-hidden="true" size={22} strokeWidth={1.8} />
        </button>
        <div className="gallery-model-info">
          <span className="gallery-model-name">{activeModel.name}</span>
          <small className="gallery-model-counter">
            {activeModelIndex + 1} / {modelCount}
          </small>
        </div>
        <button
          type="button"
          className="gallery-nav-button"
          onClick={goToNextModel}
          aria-label="Modèle suivant (flèche droite)"
        >
          <ArrowRight aria-hidden="true" size={22} strokeWidth={1.8} />
        </button>
      </nav>

      <TextureStatusBadge diagnostic={activeTextureDiagnostic} />
      <GalleryLightingPanel
        lighting={lighting}
        onChange={handleLightChange}
        onReset={resetLighting}
        onToggle={toggleLightPanel}
        open={lightPanelOpen}
      />
    </main>
  );
}
