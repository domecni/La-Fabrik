import features from "../../../../docs/user/features.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";
import { featuresFr } from "@/data/docs/docsTranslations";

export function DocsFeaturesPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={features}
      frContent={featuresFr}
      meta="08"
      title="Features"
    />
  );
}
