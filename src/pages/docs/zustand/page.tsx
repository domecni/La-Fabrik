import zustand from "../../../../docs/technical/zustand.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsZustandPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={zustand}
      frContent={zustand}
      meta="10"
      title="Zustand Stores"
    />
  );
}
