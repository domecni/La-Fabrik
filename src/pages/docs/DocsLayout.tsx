import { Link, Outlet } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { DocsLanguageProvider } from "@/pages/docs/DocsLanguageProvider";
import { docSections } from "@/pages/docs/docsSections";

export function DocsLayout(): React.JSX.Element {
  return (
    <DocsLanguageProvider>
      <main className="docs-page">
        <aside className="docs-sidebar" aria-label="Documentation">
          <header className="docs-sidebar__header">
            <h1>Folders</h1>
            <Link
              className="docs-home-link"
              to="/"
              aria-label="Retour a l'accueil"
            >
              <Home size={18} strokeWidth={2.25} aria-hidden="true" />
            </Link>
          </header>

          <nav>
            {docSections.map((section) => (
              <Link
                activeProps={{
                  className: "docs-nav-item docs-nav-item--active",
                }}
                activeOptions={{ exact: true }}
                className="docs-nav-item"
                key={section.path}
                to={section.path}
              >
                <span>
                  <strong>{section.title}</strong>
                  <small>{section.subtitle}</small>
                </span>
                <span className="docs-nav-item__meta">{section.meta}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <Outlet />
      </main>
    </DocsLanguageProvider>
  );
}
