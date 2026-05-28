import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import {
  PERSONNAGE_CONFIGS,
  PERSONNAGE_IDS,
} from "@/data/world/personnages/personnageConfig";
import { usePersonnageDebugStore } from "@/managers/stores/usePersonnageDebugStore";

function createAnimationOptions(
  animations: readonly string[],
): Record<string, string> {
  if (animations.length === 0) {
    return { None: "" };
  }

  return Object.fromEntries(
    animations.map((animation) => [animation || "None", animation]),
  );
}

export function usePersonnageDebug(): void {
  useDebugFolder("Personnages", (folder) => {
    const store = usePersonnageDebugStore.getState();

    for (const id of PERSONNAGE_IDS) {
      const config = PERSONNAGE_CONFIGS[id];
      const state = store.personnages[id];
      const characterFolder = folder.addFolder(config.label);
      const controls = {
        animation: state.animation,
        positionX: state.position[0],
        positionY: state.position[1],
        positionZ: state.position[2],
        rotationX: state.rotation[0],
        rotationY: state.rotation[1],
        rotationZ: state.rotation[2],
        scaleX: state.scale[0],
        scaleY: state.scale[1],
        scaleZ: state.scale[2],
      };

      characterFolder
        .add(controls, "animation", createAnimationOptions(config.animations))
        .name("Animation")
        .onChange((animation: string) => {
          usePersonnageDebugStore.getState().setAnimation(id, animation);
        });

      characterFolder
        .add(controls, "positionX", -120, 120, 0.1)
        .name("Position X")
        .onChange((value: number) => {
          usePersonnageDebugStore.getState().setPosition(id, 0, value);
        });
      characterFolder
        .add(controls, "positionY", -20, 40, 0.1)
        .name("Position Y")
        .onChange((value: number) => {
          usePersonnageDebugStore.getState().setPosition(id, 1, value);
        });
      characterFolder
        .add(controls, "positionZ", -120, 120, 0.1)
        .name("Position Z")
        .onChange((value: number) => {
          usePersonnageDebugStore.getState().setPosition(id, 2, value);
        });

      characterFolder
        .add(controls, "rotationX", -Math.PI, Math.PI, 0.01)
        .name("Rotation X")
        .onChange((value: number) => {
          usePersonnageDebugStore.getState().setRotation(id, 0, value);
        });
      characterFolder
        .add(controls, "rotationY", -Math.PI, Math.PI, 0.01)
        .name("Rotation Y")
        .onChange((value: number) => {
          usePersonnageDebugStore.getState().setRotation(id, 1, value);
        });
      characterFolder
        .add(controls, "rotationZ", -Math.PI, Math.PI, 0.01)
        .name("Rotation Z")
        .onChange((value: number) => {
          usePersonnageDebugStore.getState().setRotation(id, 2, value);
        });

      characterFolder
        .add(controls, "scaleX", 0.1, 5, 0.05)
        .name("Scale X")
        .onChange((value: number) => {
          usePersonnageDebugStore.getState().setScale(id, 0, value);
        });
      characterFolder
        .add(controls, "scaleY", 0.1, 5, 0.05)
        .name("Scale Y")
        .onChange((value: number) => {
          usePersonnageDebugStore.getState().setScale(id, 1, value);
        });
      characterFolder
        .add(controls, "scaleZ", 0.1, 5, 0.05)
        .name("Scale Z")
        .onChange((value: number) => {
          usePersonnageDebugStore.getState().setScale(id, 2, value);
        });

      characterFolder.close();
    }
  });
}
