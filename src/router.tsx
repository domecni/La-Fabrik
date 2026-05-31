import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { HomePage } from "@/pages/page";
import { SitePage } from "@/pages/site/page";
import { EditorPage } from "@/pages/editor/page";
import { GalleryPage } from "@/pages/gallery/page";
import { WaypointEditorPage } from "@/pages/waypoint/page";
import { BackgroundMapPage } from "@/pages/backgroundmap/page";
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
  DocsMapPerformanceRoute,
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

const siteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/site",
  component: SitePage,
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

const waypointRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/waypoint",
  component: WaypointEditorPage,
});

const backgroundMapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/backgroundmap",
  component: BackgroundMapPage,
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
  { path: "map-performance", component: DocsMapPerformanceRoute },
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
  siteRoute,
  editorRoute,
  galleryRoute,
  waypointRoute,
  backgroundMapRoute,
  docsRoute.addChildren(docsChildRoutes),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
