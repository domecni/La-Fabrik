import { Suspense, lazy } from "react";

const LazyDocsLayout = lazy(() =>
  import("@/features/docs/components/DocsLayout").then((module) => ({
    default: module.DocsLayout,
  })),
);

const LazyDocsReadmePage = lazy(() =>
  import("@/pages/docs/page").then((module) => ({
    default: module.DocsReadmePage,
  })),
);

const LazyDocsArchitecturePage = lazy(() =>
  import("@/pages/docs/architecture/page").then((module) => ({
    default: module.DocsArchitecturePage,
  })),
);

const LazyDocsTargetArchitecturePage = lazy(() =>
  import("@/pages/docs/target-architecture/page").then((module) => ({
    default: module.DocsTargetArchitecturePage,
  })),
);

const LazyDocsTechnicalEditorPage = lazy(() =>
  import("@/pages/docs/technical-editor/page").then((module) => ({
    default: module.DocsTechnicalEditorPage,
  })),
);

const LazyDocsFeaturesPage = lazy(() =>
  import("@/pages/docs/features/page").then((module) => ({
    default: module.DocsFeaturesPage,
  })),
);

const LazyDocsEditorPage = lazy(() =>
  import("@/pages/docs/editor/page").then((module) => ({
    default: module.DocsEditorPage,
  })),
);

export function DocsLayoutRoute(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyDocsLayout />
    </Suspense>
  );
}

export function DocsReadmeRoute(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyDocsReadmePage />
    </Suspense>
  );
}

export function DocsArchitectureRoute(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyDocsArchitecturePage />
    </Suspense>
  );
}

export function DocsTargetArchitectureRoute(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyDocsTargetArchitecturePage />
    </Suspense>
  );
}

export function DocsTechnicalEditorRoute(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyDocsTechnicalEditorPage />
    </Suspense>
  );
}

export function DocsFeaturesRoute(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyDocsFeaturesPage />
    </Suspense>
  );
}

export function DocsEditorRoute(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyDocsEditorPage />
    </Suspense>
  );
}
