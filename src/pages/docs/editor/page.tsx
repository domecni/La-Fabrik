import editor from "../../../../docs/user/editor.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsEditorPage(): React.JSX.Element {
  return <DocsDocument content={editor} meta="14" title="Editor User Guide" />;
}
