import readme from "../../../README.md?raw";
import { DocsDocument } from "@/pages/docs/DocsDocument";
import { readmeFr } from "@/pages/docs/docsTranslations";

export function DocsReadmePage(): React.JSX.Element {
  return (
    <DocsDocument
      content={readme}
      frContent={readmeFr}
      meta="01"
      title="README"
    />
  );
}
