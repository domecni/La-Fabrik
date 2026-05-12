import targetArchitecture from "../../../../docs/technical/target-architecture.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsTargetArchitecturePage(): React.JSX.Element {
  return (
    <DocsDocument
      content={targetArchitecture}
      frContent={targetArchitecture}
      meta="06"
      title="Target Architecture"
    />
  );
}
