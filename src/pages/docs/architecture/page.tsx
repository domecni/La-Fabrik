import architecture from "../../../../docs/technical/architecture.md?raw";
import { DocsDocument } from "@/features/docs/components/DocsDocument";
import { architectureFr } from "@/features/docs/data/docsTranslations";

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
