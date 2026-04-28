import { useState } from "react";
import {
  DocsLanguageContext,
  type DocsLanguage,
} from "@/features/docs/contexts/DocsLanguageContext";

interface DocsLanguageProviderProps {
  children: React.ReactNode;
}

export function DocsLanguageProvider({
  children,
}: DocsLanguageProviderProps): React.JSX.Element {
  const [language, setLanguage] = useState<DocsLanguage>("en");

  function toggleLanguage(): void {
    setLanguage((currentLanguage) => (currentLanguage === "en" ? "fr" : "en"));
  }

  return (
    <DocsLanguageContext value={{ language, toggleLanguage }}>
      {children}
    </DocsLanguageContext>
  );
}
