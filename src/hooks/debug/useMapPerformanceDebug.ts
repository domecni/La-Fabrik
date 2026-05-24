import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import {
  MAP_PERFORMANCE_GROUP_NAMES,
  MAP_PERFORMANCE_MODEL_NAMES,
  useMapPerformanceStore,
} from "@/managers/stores/useMapPerformanceStore";

function toLabel(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function useMapPerformanceDebug(): void {
  useDebugFolder("Performance / Map", (folder) => {
    const {
      groups,
      models,
      setGroupVisible,
      setModelVisible,
      resetVisibility,
    } = useMapPerformanceStore.getState();
    const controls = {
      ...groups,
      ...models,
      reset: () => {
        resetVisibility();
        for (const key of [
          ...MAP_PERFORMANCE_GROUP_NAMES,
          ...MAP_PERFORMANCE_MODEL_NAMES,
        ]) {
          controls[key] = true;
        }
        folder.controllersRecursive().forEach((controller) => {
          controller.updateDisplay();
        });
      },
    };

    for (const group of MAP_PERFORMANCE_GROUP_NAMES) {
      folder
        .add(controls, group)
        .name(toLabel(group))
        .onChange((visible: boolean) => setGroupVisible(group, visible));
    }

    for (const model of MAP_PERFORMANCE_MODEL_NAMES) {
      folder
        .add(controls, model)
        .name(toLabel(model))
        .onChange((visible: boolean) => setModelVisible(model, visible));
    }

    folder.add(controls, "reset").name("Reset visibility");
  });
}
