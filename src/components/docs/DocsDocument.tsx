import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDocsLanguage } from "@/hooks/docs/useDocsLanguage";

interface DocsDocumentProps {
  title: string;
  meta: string;
  content: string;
  frContent: string;
}

export function DocsDocument({
  title,
  meta,
  content,
  frContent,
}: DocsDocumentProps): React.JSX.Element {
  const { language, toggleLanguage } = useDocsLanguage();
  const hasAlternateContent = frContent !== content;
  const translatedContent = language === "fr" ? frContent : content;

  return (
    <div className="docs-content">
      <header className="docs-content__header">
        <span>{title}</span>
        {hasAlternateContent ? (
          <button
            className="docs-language-toggle"
            type="button"
            onClick={toggleLanguage}
            aria-label="Changer la langue de la documentation"
          >
            <span className={language === "fr" ? "is-active" : undefined}>
              FR
            </span>
            <span className={language === "en" ? "is-active" : undefined}>
              EN
            </span>
          </button>
        ) : null}
      </header>

      <article className="docs-section">
        <div className="docs-section__eyebrow">
          <span>{title}</span>
          <span>{meta}</span>
        </div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {translatedContent}
        </ReactMarkdown>
      </article>
    </div>
  );
}
