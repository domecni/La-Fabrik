import { useSiteStore } from "@/managers/stores/useSiteStore";
import { SiteDisclaimerScreen } from "@/components/site/SiteDisclaimerScreen";
import { SiteWelcomeScreen } from "@/components/site/SiteWelcomeScreen";
import { SiteSituationScreen } from "@/components/site/SiteSituationScreen";
import { SiteNamingScreen } from "@/components/site/SiteNamingScreen";
import { SiteTransitionOverlay } from "@/components/site/SiteTransitionOverlay";
import { SiteMobileBlocker } from "@/components/site/SiteMobileBlocker";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useIsMobile } from "@/hooks/ui/useIsMobile";

export function SitePage(): React.JSX.Element {
  const currentStep = useSiteStore((state) => state.currentStep);
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SiteMobileBlocker />;
  }

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
