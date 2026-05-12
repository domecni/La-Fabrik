import codeReview from "../../../../docs/code-review-preparation.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsCodeReviewPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={codeReview}
      frContent={codeReview}
      meta="16"
      title="Code Review Prep"
    />
  );
}
