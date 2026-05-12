import interaction from "../../../../docs/technical/interaction.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsInteractionPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={interaction}
      frContent={interaction}
      meta="05"
      title="Interaction System"
    />
  );
}
