import {
  Bounds,
  Center,
  OrbitControls,
  useAnimations,
  useGLTF,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  Component,
  Suspense,
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
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import * as THREE from "three";
import { SkyModel } from "@/components/three/world/SkyModel";
import { galleryModels, type GalleryModel } from "@/data/galleryModels";
import {
  AMBIENT_LIGHT_COLOR,
  LIGHTING_DEFAULTS,
  SUN_LIGHT_COLOR,
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
  { key: "ambientIntensity", label: "Ambiance", min: 0, max: 5, step: 0.1 },
  { key: "sunIntensity", label: "Soleil", min: 0, max: 8, step: 0.1 },
  { key: "sunX", label: "Soleil X", min: -100, max: 100, step: 1 },
  { key: "sunY", label: "Soleil Y", min: -100, max: 150, step: 1 },
  { key: "sunZ", label: "Soleil Z", min: -100, max: 100, step: 1 },
];

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
          Ce modèle ne peut pas être affiché pour le moment.
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
  const modelScene = useMemo(() => scene.clone(true), [scene]);
  const { actions } = useAnimations(animations, groupRef);

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
  const hasWarning = diagnostic.status === "warning";
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

function getTextureDiagnostic(
  modelId: string,
  modelScene: THREE.Object3D,
): TextureDiagnostic {
  let textureCount = 0;
  let missingTextureImageCount = 0;

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
  const activeModel = galleryModels[activeModelIndex] ?? galleryModels[0]!;
  const modelCount = galleryModels.length;
  const activeTextureDiagnostic =
    textureDiagnostic.modelId === activeModel.id
      ? textureDiagnostic
      : LOADING_TEXTURE_DIAGNOSTIC;

  const goToPreviousModel = (): void => {
    setActiveModelIndex((currentIndex) =>
      currentIndex === 0 ? modelCount - 1 : currentIndex - 1,
    );
  };

  const goToNextModel = (): void => {
    setActiveModelIndex((currentIndex) =>
      currentIndex === modelCount - 1 ? 0 : currentIndex + 1,
    );
  };

  const handleLightChange = (
    key: keyof GalleryLightingConfig,
    value: number,
  ): void => {
    setLighting((currentLighting) => ({
      ...currentLighting,
      [key]: value,
    }));
  };

  const resetLighting = (): void => {
    setLighting({ ...LIGHTING_DEFAULTS });
  };

  return (
    <main className="gallery-page">
      <h1 className="gallery-title">GALERIE</h1>

      <div className="gallery-canvas-frame" aria-label="Viewer 3D">
        <GalleryViewerErrorBoundary resetKey={activeModel.id}>
          <Canvas camera={{ position: [3.5, 2.4, 4.5], fov: 45 }} dpr={[1, 2]}>
            <Suspense fallback={null}>
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
          onClick={goToPreviousModel}
          aria-label="Modèle précédent"
        >
          <ArrowLeft aria-hidden="true" size={22} strokeWidth={1.8} />
        </button>
        <div className="gallery-model-info">
          <span>{activeModel.name}</span>
          <small>
            {activeModelIndex + 1} / {modelCount}
          </small>
        </div>
        <button
          type="button"
          onClick={goToNextModel}
          aria-label="Modèle suivant"
        >
          <ArrowRight aria-hidden="true" size={22} strokeWidth={1.8} />
        </button>
      </nav>

      <TextureStatusBadge diagnostic={activeTextureDiagnostic} />
      <GalleryLightingPanel
        lighting={lighting}
        onChange={handleLightChange}
        onReset={resetLighting}
        onToggle={() => setLightPanelOpen((open) => !open)}
        open={lightPanelOpen}
      />
    </main>
  );
}
