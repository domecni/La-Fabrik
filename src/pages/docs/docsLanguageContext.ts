import { createContext } from "react";

export type DocsLanguage = "en" | "fr";

export interface DocsLanguageContextValue {
  language: DocsLanguage;
  toggleLanguage: () => void;
}

export const DocsLanguageContext =
  createContext<DocsLanguageContextValue | null>(null);
