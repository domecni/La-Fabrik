import { Link, Outlet } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { DocsLanguageProvider } from "@/features/docs/providers/DocsLanguageProvider";
import { docGroups } from "@/features/docs/data/docsSections";

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
              aria-label="Retour à l'accueil"
            >
              <Home size={18} strokeWidth={2.25} aria-hidden="true" />
            </Link>
          </header>

          <nav>
            {docGroups.map((group) => (
              <section className="docs-nav-group" key={group.label}>
                <h2>{group.label}</h2>

                {group.sections.map((section) => (
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
              </section>
            ))}
          </nav>
        </aside>

        <Outlet />
      </main>
    </DocsLanguageProvider>
  );
}
