import { useSiteStore } from "@/managers/stores/useSiteStore";
import { SiteDisclaimerScreen } from "@/components/site/SiteDisclaimerScreen";
import { SiteWelcomeScreen } from "@/components/site/SiteWelcomeScreen";
import { SiteSituationScreen } from "@/components/site/SiteSituationScreen";
import { SiteNamingScreen } from "@/components/site/SiteNamingScreen";
import { SiteTransitionOverlay } from "@/components/site/SiteTransitionOverlay";
import { SiteLayout } from "@/components/site/SiteLayout";

export function SitePage(): React.JSX.Element {
  const currentStep = useSiteStore((state) => state.currentStep);

  if (currentStep === "disclaimer") {
    return <SiteDisclaimerScreen />;
  }

  return (
    <SiteLayout>
      {currentStep === "welcome" && <SiteWelcomeScreen />}
      {currentStep === "situation" && <SiteSituationScreen />}
      {currentStep === "naming" && <SiteNamingScreen />}
      {currentStep === "transition" && <SiteTransitionOverlay />}
    </SiteLayout>
  );
}
