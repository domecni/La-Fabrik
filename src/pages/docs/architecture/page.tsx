import architecture from "../../../../docs/technical/architecture.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";
import { architectureFr } from "@/data/docs/docsTranslations";

export function DocsArchitecturePage(): React.JSX.Element {
  return (
    <DocsDocument
      content={architecture}
      frContent={architectureFr}
      meta="02"
      title="Architecture actuelle"
    />
  );
}
