import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import readme from "../../README.md?raw";
import architecture from "../../docs/technical/architecture.md?raw";
import targetArchitecture from "../../docs/technical/target-architecture.md?raw";
import features from "../../docs/user/features.md?raw";

interface DocSection {
  id: string;
  title: string;
  content: string;
}

const docSections: DocSection[] = [
  {
    id: "readme",
    title: "README",
    content: readme,
  },
  {
    id: "architecture",
    title: "Architecture actuelle",
    content: architecture,
  },
  {
    id: "target-architecture",
    title: "Architecture cible",
    content: targetArchitecture,
  },
  {
    id: "features",
    title: "Fonctionnalites",
    content: features,
  },
];

export function DocsPage(): React.JSX.Element {
  return (
    <main className="docs-page">
      <aside className="docs-sidebar" aria-label="Documentation">
        <Link className="docs-back-link" to="/">
          Retour a l'experience 3D
        </Link>
        <h1>Documentation</h1>
        <nav>
          {docSections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>
      </aside>

      <div className="docs-content">
        {docSections.map((section) => (
          <article key={section.id} id={section.id} className="docs-section">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {section.content}
            </ReactMarkdown>
          </article>
        ))}
      </div>
    </main>
  );
}
