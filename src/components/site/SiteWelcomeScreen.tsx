import { useSiteStore } from "@/managers/stores/useSiteStore";
import { SiteCard } from "@/components/site/SiteCard";
import { SiteButton } from "@/components/site/SiteButton";
import { EXPERIENCE_CARDS } from "@/data/site/siteConfig";

/**
 * Screen 1: Welcome
 */
export function SiteWelcomeScreen(): React.JSX.Element {
  const selectedExperienceIndex = useSiteStore(
    (state) => state.selectedExperienceIndex,
  );
  const setSelectedExperienceIndex = useSiteStore(
    (state) => state.setSelectedExperienceIndex,
  );
  const setStep = useSiteStore((state) => state.setStep);

  const canProceed = selectedExperienceIndex !== null;

  const handleNext = (): void => {
    if (canProceed) {
      setStep("situation");
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
      <div
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            color: "#F2F2F2",
            textShadow: "0 7px 14.4px rgba(0, 0, 0, 0.25)",
            fontFamily: '"Nersans One", system-ui, sans-serif',
            fontSize: "clamp(40px, 8vw, 64px)",
            fontStyle: "normal",
            fontWeight: 400,
            lineHeight: "normal",
            letterSpacing: "-3px",
            margin: 0,
            textAlign: "center",
          }}
        >
          BIENVENUE A ALTERA
        </h1>
        <p
          style={{
            color: "#F2F2F2",
            textAlign: "center",
            textShadow: "0 7px 14.4px rgba(0, 0, 0, 0.25)",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "clamp(18px, 3vw, 26px)",
            fontStyle: "normal",
            fontWeight: 400,
            lineHeight: "normal",
            letterSpacing: "-1.3px",
            margin: 0,
          }}
        >
          Communauté convivialiste
        </p>
      </div>

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
        Choisissez une expérience :
      </h2>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {EXPERIENCE_CARDS.map((card, index) => (
          <SiteCard
            key={card.id}
            config={card}
            selected={selectedExperienceIndex === index}
            onSelect={() => {
              if (!card.disabled) {
                setSelectedExperienceIndex(index);
              }
            }}
          />
        ))}
      </div>

      <SiteButton label="SUIVANT" disabled={!canProceed} onClick={handleNext} />
    </div>
  );
}
