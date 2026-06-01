import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { useDebugVisualsStore } from "@/managers/stores/useDebugVisualsStore";

export function useDebugVisualsDebug(): void {
  useDebugFolder("Debug", (folder) => {
    const state = useDebugVisualsStore.getState();
    const controls = {
      showPlayerModel: state.showPlayerModel,
      showOctree: state.showOctree,
      octreeMinDepth: state.octreeMinDepth,
      octreeMaxDepth: state.octreeMaxDepth,
      octreeLeavesOnly: state.octreeLeavesOnly,
      octreeOpacity: state.octreeOpacity,
      octreeFabrikOnly: state.octreeFabrikOnly,
    };

    folder
      .add(controls, "showPlayerModel")
      .name("Show Player Model")
      .onChange((value: boolean) => {
        useDebugVisualsStore.getState().setShowPlayerModel(value);
      });

    folder
      .add(controls, "showOctree")
      .name("Show Octree")
      .onChange((value: boolean) => {
        useDebugVisualsStore.getState().setShowOctree(value);
      });

    folder
      .add(controls, "octreeLeavesOnly")
      .name("Octree Leaves Only")
      .onChange((value: boolean) => {
        useDebugVisualsStore.getState().setOctreeLeavesOnly(value);
      });

    folder
      .add(controls, "octreeMinDepth", 0, 10, 1)
      .name("Octree Min Depth")
      .onChange((value: number) => {
        useDebugVisualsStore.getState().setOctreeMinDepth(value);
      });

    folder
      .add(controls, "octreeMaxDepth", 0, 10, 1)
      .name("Octree Max Depth")
      .onChange((value: number) => {
        useDebugVisualsStore.getState().setOctreeMaxDepth(value);
      });

    folder
      .add(controls, "octreeOpacity", 0.05, 1, 0.05)
      .name("Octree Opacity")
      .onChange((value: number) => {
        useDebugVisualsStore.getState().setOctreeOpacity(value);
      });

    folder
      .add(controls, "octreeFabrikOnly")
      .name("Octree Fabrik Only")
      .onChange((value: boolean) => {
        useDebugVisualsStore.getState().setOctreeFabrikOnly(value);
      });
  });
}
