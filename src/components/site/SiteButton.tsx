import { useState } from "react";

interface SiteButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export function SiteButton({
  label,
  disabled = false,
  onClick,
}: SiteButtonProps): React.JSX.Element {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className="site-button"
      style={{
        display: "inline-flex",
        padding: "12px 20px",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        background: disabled ? "#b0b0b0" : "#FFF",
        boxShadow: disabled
          ? "none"
          : isPressed
            ? "0 4px 10px 0 rgba(0, 0, 0, 0.35)"
            : "0 7px 14.4px 0 rgba(0, 0, 0, 0.25)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "#888888" : "#000",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "clamp(18px, 3vw, 26px)",
        fontStyle: "normal",
        fontWeight: 700,
        lineHeight: "normal",
        letterSpacing: "-1.3px",
        textTransform: "uppercase",
        transition: "box-shadow 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}
