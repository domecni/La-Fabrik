import targetArchitecture from "../../../../docs/technical/target-architecture.md?raw";
import { DocsDocument } from "@/features/docs/components/DocsDocument";
import { targetArchitectureFr } from "@/features/docs/data/docsTranslations";

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
