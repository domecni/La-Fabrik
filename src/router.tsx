import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { HomePage } from "@/pages/HomePage";
import { EditorPage } from "@/pages/editor/EditorPage";
import {
  DocsArchitectureRoute,
  DocsFeaturesRoute,
  DocsLayoutRoute,
  DocsReadmeRoute,
  DocsTargetArchitectureRoute,
} from "@/pages/docs/DocsRouteComponents";

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

const docsIndexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/",
  component: DocsReadmeRoute,
});

const docsArchitectureRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/architecture",
  component: DocsArchitectureRoute,
});

const docsTargetArchitectureRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/target-architecture",
  component: DocsTargetArchitectureRoute,
});

const docsFeaturesRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/features",
  component: DocsFeaturesRoute,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  editorRoute,
  docsRoute.addChildren([
    docsIndexRoute,
    docsArchitectureRoute,
    docsTargetArchitectureRoute,
    docsFeaturesRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
