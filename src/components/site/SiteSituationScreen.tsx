import { useSiteStore } from "@/managers/stores/useSiteStore";
import { SiteCard } from "@/components/site/SiteCard";
import { SiteButton } from "@/components/site/SiteButton";
import { SITUATION_CARDS } from "@/data/site/siteConfig";

/**
 * Screen 2: Situation selection
 */
export function SiteSituationScreen(): React.JSX.Element {
  const selectedSituationIndex = useSiteStore(
    (state) => state.selectedSituationIndex,
  );
  const setSelectedSituationIndex = useSiteStore(
    (state) => state.setSelectedSituationIndex,
  );
  const setStep = useSiteStore((state) => state.setStep);

  const canProceed = selectedSituationIndex !== null;

  const handleConfirm = (): void => {
    if (canProceed) {
      setStep("naming");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
        padding: 24,
        width: "100%",
        maxWidth: 1208,
      }}
    >
      <h2
        style={{
          color: "#F2F2F2",
          textAlign: "center",
          textShadow: "0 7px 14.4px rgba(0, 0, 0, 0.25)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "clamp(20px, 4vw, 32px)",
          fontStyle: "normal",
          fontWeight: 700,
          lineHeight: "normal",
          letterSpacing: "-1.6px",
          margin: 0,
        }}
      >
        Quelle est votre situation ?
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(220px, 300px))",
          gap: "24px 28px",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {SITUATION_CARDS.map((card, index) => (
          <SiteCard
            key={card.id}
            config={card}
            selected={selectedSituationIndex === index}
            variant="situation"
            onSelect={() => {
              if (!card.disabled) {
                setSelectedSituationIndex(index);
              }
            }}
          />
        ))}
      </div>

      <SiteButton
        label="CONFIRMER"
        disabled={!canProceed}
        onClick={handleConfirm}
      />
    </div>
  );
}
