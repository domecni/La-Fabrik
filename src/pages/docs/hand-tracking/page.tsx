import handTracking from "../../../../docs/technical/hand-tracking.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsHandTrackingPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={handTracking}
      frContent={handTracking}
      meta="09"
      title="Hand Tracking Technical Notes"
    />
  );
}
