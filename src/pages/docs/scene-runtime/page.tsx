import sceneRuntime from "../../../../docs/technical/scene-runtime.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsSceneRuntimePage(): React.JSX.Element {
  return (
    <DocsDocument
      content={sceneRuntime}
      frContent={sceneRuntime}
      meta="03"
      title="Scene Runtime"
    />
  );
}
