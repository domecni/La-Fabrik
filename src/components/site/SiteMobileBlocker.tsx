import { SITE_BACKGROUND_STYLE } from "@/data/site/siteConfig";

const MOBILE_TEXT =
  "Ce site a été conçu pour être utilisé sur ordinateur. Veuillez réessayer sur votre ordinateur pour une expérience optimale.";

export function SiteMobileBlocker(): React.JSX.Element {
  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 48,
        ...SITE_BACKGROUND_STYLE,
      }}
    >
      <img
        src="/assets/logo.png"
        alt="Logo Altera"
        style={{ width: 120, height: "auto" }}
      />
      <p
        style={{
          color: "#F2F2F2",
          textAlign: "center",
          textShadow: "0 4px 10px rgba(0, 0, 0, 0.4)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 18,
          fontWeight: 500,
          lineHeight: 1.6,
          maxWidth: 320,
          margin: 0,
        }}
      >
        {MOBILE_TEXT}
      </p>
    </div>
  );
}
