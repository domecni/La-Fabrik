import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { TalkieModel } from "@/components/ui/talkie/TalkieModel";
import { TalkieSignalLines } from "@/components/ui/talkie/TalkieSignalLines";
import { useTalkieDialogueOverlayState } from "@/hooks/ui/useTalkieDialogueOverlayState";

export function TalkieDialogueOverlay(): React.JSX.Element | null {
  const { isNarratorDialogue, isVisible } = useTalkieDialogueOverlayState();

  if (!isVisible) return null;

  return (
    <aside
      className={`talkie-dialogue-overlay${isNarratorDialogue ? " talkie-dialogue-overlay--active" : ""}`}
      aria-hidden="true"
    >
      {isNarratorDialogue ? <TalkieSignalLines side="left" /> : null}
      {isNarratorDialogue ? <TalkieSignalLines side="right" /> : null}
      <div className="talkie-dialogue-overlay__model-frame">
        <Canvas
          camera={{ position: [0, 0, 4.2], zoom: 56 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          orthographic
        >
          <ambientLight intensity={2.5} />
          <directionalLight position={[2, 3, 4]} intensity={2.8} />
          <Suspense fallback={null}>
            <TalkieModel active={isNarratorDialogue} />
          </Suspense>
        </Canvas>
      </div>
    </aside>
  );
}
