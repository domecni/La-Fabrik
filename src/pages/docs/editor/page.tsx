import editor from "../../../../docs/user/editor.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";
import { editorFr } from "@/data/docs/docsTranslations";

export function DocsEditorPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={editor}
      frContent={editorFr}
      meta="07"
      title="Editor User Guide"
    />
  );
}
