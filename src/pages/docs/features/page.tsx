import features from "../../../../docs/user/features.md?raw";
import { DocsDocument } from "@/pages/docs/DocsDocument";
import { featuresFr } from "@/pages/docs/docsTranslations";

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
