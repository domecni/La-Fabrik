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
    if (disabled) return "rgba(255, 255, 255, 0.42)";
    return "#b8b8b8";
  };

  const borderColor = selected ? "#a8d5a2" : "rgba(255, 255, 255, 0.55)";

  const textColor = disabled ? "rgba(77, 77, 77, 0.72)" : "#4d4d4d";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={label}
      className="site-card-button"
      style={{
        width: isSituation
          ? "clamp(220px, 24vw, 300px)"
          : "clamp(120px, 15vw, 160px)",
        height: isSituation
          ? "clamp(48px, 6vw, 60px)"
          : "clamp(140px, 18vw, 180px)",
        border: `3px solid ${borderColor}`,
        background: getBackground(),
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
        flexShrink: 0,
      }}
    >
      {!imagePath && (
        <span
          style={{
            color: textColor,
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
