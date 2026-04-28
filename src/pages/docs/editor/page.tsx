import editor from "../../../../docs/user/editor.md?raw";
import { DocsDocument } from "@/pages/docs/DocsDocument";
import { editorFr } from "@/pages/docs/docsTranslations";

export function DocsEditorPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={editor}
      frContent={editorFr}
      meta="06"
      title="Editor User Guide"
    />
  );
}
