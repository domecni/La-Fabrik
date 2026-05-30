import type { SiteCardConfig } from "@/data/site/siteConfig";

interface SiteCardProps {
  config: SiteCardConfig;
  selected: boolean;
  onSelect: () => void;
  variant?: "default" | "situation";
}

export function SiteCard({
  config,
  selected,
  onSelect,
  variant = "default",
}: SiteCardProps): React.JSX.Element {
  const { label, imagePath, disabled } = config;
  const isSituation = variant === "situation";

  const getBackground = (): string => {
    if (imagePath) return `url(${imagePath}) center/cover`;
    if (isSituation) return "rgba(255, 255, 255, 0.42)";
    if (disabled) return "#b8b8b8";
    if (selected) return "#d9d9d9";
    return "#e8e8e8";
  };

  const getBorder = (): string => {
    if (selected) return "3px solid #a8d5a2";
    if (isSituation) return "3px solid rgba(255, 255, 255, 0.55)";
    if (disabled) return "none";
    return "2px solid #ffffff";
  };

  const getTextColor = (): string => {
    if (isSituation && disabled) return "rgba(77, 77, 77, 0.72)";
    if (isSituation) return "#4d4d4d";
    if (disabled) return "#888888";
    return "#666666";
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      style={{
        width: isSituation
          ? "clamp(220px, 24vw, 300px)"
          : "clamp(120px, 15vw, 160px)",
        height: isSituation
          ? "clamp(48px, 6vw, 60px)"
          : "clamp(140px, 18vw, 180px)",
        border: getBorder(),
        background: getBackground(),
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
        outline: "none",
        flexShrink: 0,
      }}
    >
      {!imagePath && (
        <span
          style={{
            color: getTextColor(),
            fontSize: isSituation
              ? "clamp(14px, 1.8vw, 22px)"
              : "clamp(10px, 1.5vw, 14px)",
            fontWeight: isSituation ? 700 : 500,
            textAlign: "center",
            padding: 8,
            lineHeight: 1,
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
