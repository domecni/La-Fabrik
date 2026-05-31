export function FadeToVideoOverlay(): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 29,
        background: "#000",
        pointerEvents: "none",
      }}
    />
  );
}
