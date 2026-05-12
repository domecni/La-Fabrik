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

function createDocsRoute(
  Component: React.LazyExoticComponent<React.ComponentType>,
): () => React.JSX.Element {
  return function DocsRoute(): React.JSX.Element {
    return withDocsSuspense(Component);
  };
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
const LazyDocsSceneRuntimePage = lazyNamed(
  () => import("@/pages/docs/scene-runtime/page"),
  "DocsSceneRuntimePage",
);
const LazyDocsRepairGamePage = lazyNamed(
  () => import("@/pages/docs/repair-game/page"),
  "DocsRepairGamePage",
);
const LazyDocsInteractionPage = lazyNamed(
  () => import("@/pages/docs/interaction/page"),
  "DocsInteractionPage",
);
const LazyDocsTechnicalEditorPage = lazyNamed(
  () => import("@/pages/docs/technical-editor/page"),
  "DocsTechnicalEditorPage",
);
const LazyDocsAudioPage = lazyNamed(
  () => import("@/pages/docs/audio/page"),
  "DocsAudioPage",
);
const LazyDocsHandTrackingPage = lazyNamed(
  () => import("@/pages/docs/hand-tracking/page"),
  "DocsHandTrackingPage",
);
const LazyDocsZustandPage = lazyNamed(
  () => import("@/pages/docs/zustand/page"),
  "DocsZustandPage",
);
const LazyDocsThreeDebuggingPage = lazyNamed(
  () => import("@/pages/docs/three-debugging/page"),
  "DocsThreeDebuggingPage",
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
const LazyDocsCodeReviewPage = lazyNamed(
  () => import("@/pages/docs/code-review/page"),
  "DocsCodeReviewPage",
);

export const DocsLayoutRoute = createDocsRoute(LazyDocsLayout);
export const DocsReadmeRoute = createDocsRoute(LazyDocsReadmePage);
export const DocsArchitectureRoute = createDocsRoute(LazyDocsArchitecturePage);
export const DocsSceneRuntimeRoute = createDocsRoute(LazyDocsSceneRuntimePage);
export const DocsRepairGameRoute = createDocsRoute(LazyDocsRepairGamePage);
export const DocsInteractionRoute = createDocsRoute(LazyDocsInteractionPage);
export const DocsTargetArchitectureRoute = createDocsRoute(
  LazyDocsTargetArchitecturePage,
);
export const DocsTechnicalEditorRoute = createDocsRoute(
  LazyDocsTechnicalEditorPage,
);
export const DocsAudioRoute = createDocsRoute(LazyDocsAudioPage);
export const DocsHandTrackingRoute = createDocsRoute(LazyDocsHandTrackingPage);
export const DocsZustandRoute = createDocsRoute(LazyDocsZustandPage);
export const DocsThreeDebuggingRoute = createDocsRoute(
  LazyDocsThreeDebuggingPage,
);
export const DocsFeaturesRoute = createDocsRoute(LazyDocsFeaturesPage);
export const DocsMainFeatureRoute = createDocsRoute(LazyDocsMainFeaturePage);
export const DocsEditorRoute = createDocsRoute(LazyDocsEditorPage);
export const DocsAnimationRoute = createDocsRoute(LazyDocsAnimationPage);
export const DocsCodeReviewRoute = createDocsRoute(LazyDocsCodeReviewPage);
