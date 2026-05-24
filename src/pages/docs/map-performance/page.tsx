import mapPerformance from "../../../../docs/technical/map-performance.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsMapPerformancePage(): React.JSX.Element {
  return (
    <DocsDocument
      content={mapPerformance}
      frContent={mapPerformance}
      meta="12"
      title="Map Performance"
    />
  );
}
