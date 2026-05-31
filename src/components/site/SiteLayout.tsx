import type { ReactNode } from "react";
import { SITE_BACKGROUND_STYLE } from "@/data/site/siteConfig";
import { Subtitles } from "@/components/ui/Subtitles";

interface SiteLayoutProps {
  children: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps): React.JSX.Element {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...SITE_BACKGROUND_STYLE,
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {children}
      <Subtitles />
    </div>
  );
}
