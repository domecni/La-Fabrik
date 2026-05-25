import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { HomePage } from "@/pages/page";
import { EditorPage } from "@/pages/editor/page";
import { GalleryPage } from "@/pages/gallery/page";
import {
  DocsAnimationRoute,
  DocsAudioRoute,
  DocsArchitectureRoute,
  DocsCodeReviewRoute,
  DocsEditorRoute,
  DocsFeaturesRoute,
  DocsGalleryRoute,
  DocsHandTrackingRoute,
  DocsInteractionRoute,
  DocsLayoutRoute,
  DocsMainFeatureRoute,
  DocsMissionFlowRoute,
  DocsReadmeRoute,
  DocsRepairGameRoute,
  DocsSceneRuntimeRoute,
  DocsTargetArchitectureRoute,
  DocsTechnicalEditorRoute,
  DocsThreeDebuggingRoute,
  DocsZustandRoute,
} from "@/routes/DocsRoute";

const rootRoute = createRootRoute({
  component: Outlet,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor",
  component: EditorPage,
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gallery",
  component: GalleryPage,
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: DocsLayoutRoute,
});

const docsChildRoutes = [
  { path: "/", component: DocsReadmeRoute },
  { path: "architecture", component: DocsArchitectureRoute },
  { path: "scene-runtime", component: DocsSceneRuntimeRoute },
  { path: "repair-game", component: DocsRepairGameRoute },
  { path: "mission-flow", component: DocsMissionFlowRoute },
  { path: "interaction", component: DocsInteractionRoute },
  { path: "target-architecture", component: DocsTargetArchitectureRoute },
  { path: "technical-editor", component: DocsTechnicalEditorRoute },
  { path: "audio", component: DocsAudioRoute },
  { path: "hand-tracking", component: DocsHandTrackingRoute },
  { path: "zustand", component: DocsZustandRoute },
  { path: "three-debugging", component: DocsThreeDebuggingRoute },
  { path: "features", component: DocsFeaturesRoute },
  { path: "main-feature", component: DocsMainFeatureRoute },
  { path: "editor", component: DocsEditorRoute },
  { path: "animation", component: DocsAnimationRoute },
  { path: "gallery", component: DocsGalleryRoute },
  { path: "code-review", component: DocsCodeReviewRoute },
].map(({ path, component }) =>
  createRoute({
    getParentRoute: () => docsRoute,
    path,
    component,
  }),
);

const routeTree = rootRoute.addChildren([
  indexRoute,
  editorRoute,
  galleryRoute,
  docsRoute.addChildren(docsChildRoutes),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
