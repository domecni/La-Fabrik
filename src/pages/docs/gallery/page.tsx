import gallery from "../../../../docs/user/gallery.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsGalleryPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={gallery}
      frContent={gallery}
      meta="16"
      title="Model Gallery"
    />
  );
}
