import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { HomePage } from "@/pages/page";
import { EditorPage } from "@/pages/editor/page";
import {
  DocsAnimationRoute,
  DocsArchitectureRoute,
  DocsEditorRoute,
  DocsFeaturesRoute,
  DocsLayoutRoute,
  DocsReadmeRoute,
  DocsTargetArchitectureRoute,
  DocsTechnicalEditorRoute,
  DocsZustandRoute,
} from "@/routes/docs/DocsRouteComponents";

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

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: DocsLayoutRoute,
});

const docsChildRoutes = [
  { path: "/", component: DocsReadmeRoute },
  { path: "architecture", component: DocsArchitectureRoute },
  { path: "target-architecture", component: DocsTargetArchitectureRoute },
  { path: "technical-editor", component: DocsTechnicalEditorRoute },
  { path: "zustand", component: DocsZustandRoute },
  { path: "features", component: DocsFeaturesRoute },
  { path: "editor", component: DocsEditorRoute },
  { path: "animation", component: DocsAnimationRoute },
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
  docsRoute.addChildren(docsChildRoutes),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
