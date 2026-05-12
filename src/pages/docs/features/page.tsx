import features from "../../../../docs/user/features.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsFeaturesPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={features}
      frContent={features}
      meta="12"
      title="Features"
    />
  );
}
