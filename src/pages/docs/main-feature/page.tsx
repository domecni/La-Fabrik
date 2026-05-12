import mainFeature from "../../../../docs/user/main-feature.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsMainFeaturePage(): React.JSX.Element {
  return (
    <DocsDocument
      content={mainFeature}
      frContent={mainFeature}
      meta="09"
      title="Main Feature"
    />
  );
}
