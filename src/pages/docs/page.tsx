import readme from "../../../README.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsReadmePage(): React.JSX.Element {
  return (
    <DocsDocument
      content={readme}
      frContent={readme}
      meta="01"
      title="README"
    />
  );
}
