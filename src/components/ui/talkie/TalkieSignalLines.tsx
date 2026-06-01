interface TalkieSignalLinesProps {
  side: "left" | "right";
}

export function TalkieSignalLines({
  side,
}: TalkieSignalLinesProps): React.JSX.Element {
  return (
    <svg
      className={`talkie-dialogue-overlay__signals talkie-dialogue-overlay__signals--${side}`}
      viewBox="0 0 90 120"
      aria-hidden="true"
    >
      <path d="M18 48 C30 58 30 72 18 82" />
      <path d="M34 34 C56 52 56 78 34 96" />
      <path d="M52 20 C84 46 84 84 52 110" />
    </svg>
  );
}
