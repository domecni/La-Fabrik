export interface DocSection {
  path: string;
  title: string;
  subtitle: string;
  meta: string;
}

export const docSections: DocSection[] = [
  {
    path: "/docs",
    title: "README",
    subtitle: "Project overview",
    meta: "01",
  },
  {
    path: "/docs/architecture",
    title: "Architecture actuelle",
    subtitle: "Runtime structure",
    meta: "02",
  },
  {
    path: "/docs/target-architecture",
    title: "Architecture cible",
    subtitle: "Next direction",
    meta: "03",
  },
  {
    path: "/docs/features",
    title: "Fonctionnalites",
    subtitle: "Implemented scope",
    meta: "04",
  },
];
