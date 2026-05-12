import technicalEditor from "../../../../docs/technical/editor.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsTechnicalEditorPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={technicalEditor}
      frContent={technicalEditor}
      meta="07"
      title="Editor Technical Notes"
    />
  );
}
