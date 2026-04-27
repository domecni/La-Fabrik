import { useContext } from "react";
import { DocsLanguageContext } from "@/pages/docs/docsLanguageContext";

export function useDocsLanguage() {
  const context = useContext(DocsLanguageContext);

  if (!context) {
    throw new Error("useDocsLanguage must be used inside DocsLanguageProvider");
  }

  return context;
}
