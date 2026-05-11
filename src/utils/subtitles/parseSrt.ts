export interface SubtitleCue {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

const SRT_TIME_SEPARATOR = " --> ";
const SRT_TIME_PATTERN = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/;

export function parseSrt(srtContent: string): SubtitleCue[] {
  return srtContent
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .trim()
    .split(/\n{2,}/)
    .map(parseSrtBlock)
    .filter((cue): cue is SubtitleCue => cue !== null);
}

function parseSrtBlock(block: string): SubtitleCue | null {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3) return null;

  const index = Number(lines[0]);
  if (!Number.isInteger(index)) return null;

  const [start, end] = lines[1]?.split(SRT_TIME_SEPARATOR) ?? [];
  if (!start || !end) return null;

  const startTime = parseSrtTime(start);
  const endTime = parseSrtTime(end);
  if (startTime === null || endTime === null || endTime <= startTime) {
    return null;
  }

  return {
    index,
    startTime,
    endTime,
    text: lines.slice(2).join("\n"),
  };
}

function parseSrtTime(value: string): number | null {
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
