import readme from "../../../README.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";
import { readmeFr } from "@/data/docs/docsTranslations";

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
