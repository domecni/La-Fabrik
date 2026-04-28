import targetArchitecture from "../../../../docs/technical/target-architecture.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";
import { targetArchitectureFr } from "@/data/docs/docsTranslations";

export function DocsTargetArchitecturePage(): React.JSX.Element {
  return (
    <DocsDocument
      content={targetArchitecture}
      frContent={targetArchitectureFr}
      meta="03"
      title="Architecture cible"
    />
  );
}
