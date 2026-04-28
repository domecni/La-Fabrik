import editor from "../../../../docs/user/editor.md?raw";
import { DocsDocument } from "@/features/docs/components/DocsDocument";
import { editorFr } from "@/features/docs/data/docsTranslations";

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
