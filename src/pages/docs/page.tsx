import readme from "../../../README.md?raw";
import { DocsDocument } from "@/features/docs/components/DocsDocument";
import { readmeFr } from "@/features/docs/data/docsTranslations";

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
