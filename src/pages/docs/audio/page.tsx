import audio from "../../../../docs/technical/audio.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsAudioPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={audio}
      frContent={audio}
      meta="08"
      title="Audio Technical Notes"
    />
  );
}
