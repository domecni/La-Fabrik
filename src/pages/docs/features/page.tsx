import features from "../../../../docs/user/features.md?raw";
import { DocsDocument } from "@/features/docs/components/DocsDocument";
import { featuresFr } from "@/features/docs/data/docsTranslations";

export function DocsFeaturesPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={features}
      frContent={featuresFr}
      meta="05"
      title="Features"
    />
  );
}
