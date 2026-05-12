import architecture from "../../../../docs/technical/architecture.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsArchitecturePage(): React.JSX.Element {
  return (
    <DocsDocument
      content={architecture}
      frContent={architecture}
      meta="02"
      title="Current Architecture"
    />
  );
}
