import { Suspense, lazy } from "react";

function lazyNamed<T extends Record<string, React.ComponentType>>(
  loader: () => Promise<T>,
  exportName: keyof T,
): React.LazyExoticComponent<T[keyof T]> {
  return lazy(() =>
    loader().then((module) => ({ default: module[exportName] })),
  );
}

function withDocsSuspense(
  Component: React.LazyExoticComponent<React.ComponentType>,
): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  );
}

const LazyDocsLayout = lazyNamed(
  () => import("@/components/docs/DocsLayout"),
  "DocsLayout",
);
const LazyDocsReadmePage = lazyNamed(
  () => import("@/pages/docs/page"),
  "DocsReadmePage",
);
const LazyDocsArchitecturePage = lazyNamed(
  () => import("@/pages/docs/architecture/page"),
  "DocsArchitecturePage",
);
const LazyDocsTargetArchitecturePage = lazyNamed(
  () => import("@/pages/docs/target-architecture/page"),
  "DocsTargetArchitecturePage",
);
const LazyDocsTechnicalEditorPage = lazyNamed(
  () => import("@/pages/docs/technical-editor/page"),
  "DocsTechnicalEditorPage",
);
const LazyDocsHandTrackingPage = lazyNamed(
  () => import("@/pages/docs/hand-tracking/page"),
  "DocsHandTrackingPage",
);
const LazyDocsZustandPage = lazyNamed(
  () => import("@/pages/docs/zustand/page"),
  "DocsZustandPage",
);
const LazyDocsFeaturesPage = lazyNamed(
  () => import("@/pages/docs/features/page"),
  "DocsFeaturesPage",
);
const LazyDocsMainFeaturePage = lazyNamed(
  () => import("@/pages/docs/main-feature/page"),
  "DocsMainFeaturePage",
);
const LazyDocsEditorPage = lazyNamed(
  () => import("@/pages/docs/editor/page"),
  "DocsEditorPage",
);
const LazyDocsAnimationPage = lazyNamed(
  () => import("@/pages/docs/animation/page"),
  "DocsAnimationPage",
);

export function DocsLayoutRoute(): React.JSX.Element {
  return withDocsSuspense(LazyDocsLayout);
}

export function DocsReadmeRoute(): React.JSX.Element {
  return withDocsSuspense(LazyDocsReadmePage);
}

export function DocsArchitectureRoute(): React.JSX.Element {
  return withDocsSuspense(LazyDocsArchitecturePage);
}

export function DocsTargetArchitectureRoute(): React.JSX.Element {
  return withDocsSuspense(LazyDocsTargetArchitecturePage);
}

export function DocsTechnicalEditorRoute(): React.JSX.Element {
  return withDocsSuspense(LazyDocsTechnicalEditorPage);
}

export function DocsHandTrackingRoute(): React.JSX.Element {
  return withDocsSuspense(LazyDocsHandTrackingPage);
}

export function DocsZustandRoute(): React.JSX.Element {
  return withDocsSuspense(LazyDocsZustandPage);
}

export function DocsFeaturesRoute(): React.JSX.Element {
  return withDocsSuspense(LazyDocsFeaturesPage);
}

export function DocsMainFeatureRoute(): React.JSX.Element {
  return withDocsSuspense(LazyDocsMainFeaturePage);
}

export function DocsEditorRoute(): React.JSX.Element {
  return withDocsSuspense(LazyDocsEditorPage);
}

export function DocsAnimationRoute(): React.JSX.Element {
  return withDocsSuspense(LazyDocsAnimationPage);
}
