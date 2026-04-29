import animation from "../../../../docs/technical/animation.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsAnimationPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={animation}
      frContent={animation}
      meta="07"
      title="Animation & 3D Model System"
    />
  );
}
