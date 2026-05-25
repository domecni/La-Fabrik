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
import * as THREE from "three";
import { SkyModel } from "@/components/three/world/SkyModel";
import {
  GAME_SCENE_FALLBACK_SKY_MODEL_PATH,
  GAME_SCENE_FALLBACK_SKY_MODEL_SCALE,
  GAME_SCENE_SKY_MODEL_PATH,
  GAME_SCENE_SKY_MODEL_SCALE,
} from "@/data/world/environmentConfig";
import { galleryModels, type GalleryModel } from "@/data/galleryModels";

interface GalleryModelProps {
  model: GalleryModel;
}

interface GalleryViewerErrorBoundaryProps {
  children: ReactNode;
  resetKey: string;
}

interface GalleryViewerErrorBoundaryState {
  hasError: boolean;
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
          Ce modèle ne peut pas être affiché pour le moment.
        </div>
      );
    }

    return this.props.children;
  }
}

function GalleryModelPreview({ model }: GalleryModelProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const { animations, scene } = useGLTF(model.path);
  const modelScene = useMemo(() => scene.clone(true), [scene]);
  const { actions } = useAnimations(animations, groupRef);

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

function GalleryScene({ model }: GalleryModelProps): React.JSX.Element {
  return (
    <>
      <SkyModel
        fallbackModelPath={GAME_SCENE_FALLBACK_SKY_MODEL_PATH}
        fallbackScale={GAME_SCENE_FALLBACK_SKY_MODEL_SCALE}
        modelPath={GAME_SCENE_SKY_MODEL_PATH}
        scale={GAME_SCENE_SKY_MODEL_SCALE}
      />
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 8, 4]} intensity={2.1} />
      <Bounds fit clip observe margin={1.35}>
        <Center>
          <GalleryModelPreview model={model} />
        </Center>
      </Bounds>
      <OrbitControls
        makeDefault
        enableDamping
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export function GalleryPage(): React.JSX.Element {
  const [activeModelIndex, setActiveModelIndex] = useState(0);
  const activeModel = galleryModels[activeModelIndex] ?? galleryModels[0]!;
  const modelCount = galleryModels.length;

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

  return (
    <main className="gallery-page">
      <section className="gallery-hero" aria-labelledby="gallery-title">
        <p className="gallery-eyebrow">Galerie des modèles</p>
        <h1 id="gallery-title">Merci aux designers de La Fabrik</h1>
        <p>
          Une vitrine simple pour parcourir les modèles 3D du projet dans leur
          propre canvas, avec la même skybox que l'expérience principale.
        </p>
      </section>

      <section className="gallery-viewer-panel" aria-label="Viewer 3D">
        <div className="gallery-viewer-header">
          <div>
            <p className="gallery-model-count">
              {activeModelIndex + 1} / {modelCount}
            </p>
            <h2>{activeModel.name}</h2>
            <code>{activeModel.path}</code>
          </div>
          <div className="gallery-controls" aria-label="Navigation des modèles">
            <button
              type="button"
              onClick={goToPreviousModel}
              aria-label="Modèle précédent"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goToNextModel}
              aria-label="Modèle suivant"
            >
              →
            </button>
          </div>
        </div>

        <div className="gallery-canvas-frame">
          <GalleryViewerErrorBoundary resetKey={activeModel.id}>
            <Canvas
              camera={{ position: [3.5, 2.4, 4.5], fov: 45 }}
              dpr={[1, 2]}
            >
              <Suspense fallback={null}>
                <GalleryScene key={activeModel.id} model={activeModel} />
              </Suspense>
            </Canvas>
          </GalleryViewerErrorBoundary>
        </div>

        <p className="gallery-help-text">
          Utilise les flèches pour changer de modèle. Tu peux tourner autour du
          modèle avec la souris ou le doigt.
        </p>
      </section>
    </main>
  );
}
