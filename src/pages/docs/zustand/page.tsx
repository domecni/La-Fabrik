import zustand from "../../../../docs/technical/zustand.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";
import { zustandFr } from "@/data/docs/docsTranslations";

export function DocsZustandPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={zustand}
      frContent={zustandFr}
      meta="05"
      title="Zustand Game State"
    />
  );
}
