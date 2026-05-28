export interface SubtitleCue {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

interface SrtParseDiagnostic {
  blockIndex: number;
  reason: string;
}

export interface SrtParseResult {
  cues: SubtitleCue[];
  diagnostics: SrtParseDiagnostic[];
}

const SRT_TIME_SEPARATOR = " --> ";
const SRT_TIME_PATTERN = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/;

export function parseSrt(srtContent: string): SubtitleCue[] {
  return parseSrtWithDiagnostics(srtContent).cues;
}

export function parseSrtWithDiagnostics(srtContent: string): SrtParseResult {
  const diagnostics: SrtParseDiagnostic[] = [];
  const cues = srtContent
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .trim()
    .split(/\n{2,}/)
    .map((block, blockIndex) => {
      const result = parseSrtBlock(block);

      if (!result.cue) {
        diagnostics.push({ blockIndex, reason: result.reason });
      }

      return result.cue;
    })
    .filter((cue): cue is SubtitleCue => cue !== null);

  return { cues, diagnostics };
}

function parseSrtBlock(block: string): {
  cue: SubtitleCue | null;
  reason: string;
} {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3) {
    return { cue: null, reason: "missing index, timecode, or text" };
  }

  const index = Number(lines[0]);
  if (!Number.isInteger(index)) {
    return { cue: null, reason: "invalid cue index" };
  }

  const [start, end] = lines[1]?.split(SRT_TIME_SEPARATOR) ?? [];
  if (!start || !end) {
    return { cue: null, reason: "invalid timecode separator" };
  }

  const startTime = parseSrtTime(start);
  const endTime = parseSrtTime(end);
  if (startTime === null || endTime === null || endTime <= startTime) {
    return { cue: null, reason: "invalid cue duration" };
  }

  return {
    cue: {
      index,
      startTime,
      endTime,
      text: lines.slice(2).join("\n"),
    },
    reason: "",
  };
}

export function parseSrtTime(value: string): number | null {
  const match = value.match(SRT_TIME_PATTERN);
  if (!match) return null;

  const [, hours, minutes, seconds, milliseconds] = match;
  if (!hours || !minutes || !seconds || !milliseconds) return null;

  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(milliseconds) / 1000
  );
}
