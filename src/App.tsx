import { RouterProvider } from "@tanstack/react-router";
import { SiteMobileBlocker } from "@/components/site/SiteMobileBlocker";
import { useIsMobile } from "@/hooks/ui/useIsMobile";
import { router } from "@/router";

function App(): React.JSX.Element {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SiteMobileBlocker />;
  }

  return <RouterProvider router={router} />;
}

export default App;
