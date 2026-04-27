import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { HomePage } from "@/pages/HomePage";
import { DocsArchitecturePage } from "@/pages/docs/architecture/page";
import { DocsLayout } from "@/pages/docs/DocsLayout";
import { DocsFeaturesPage } from "@/pages/docs/features/page";
import { DocsReadmePage } from "@/pages/docs/page";
import { DocsTargetArchitecturePage } from "@/pages/docs/target-architecture/page";

const rootRoute = createRootRoute({
  component: Outlet,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: DocsLayout,
});

const docsIndexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/",
  component: DocsReadmePage,
});

const docsArchitectureRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/architecture",
  component: DocsArchitecturePage,
});

const docsTargetArchitectureRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/target-architecture",
  component: DocsTargetArchitecturePage,
});

const docsFeaturesRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/features",
  component: DocsFeaturesPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
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
