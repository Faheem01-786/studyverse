import type { backendInterface } from "@/backend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { setActorForTest } from "./setup";

/**
 * Render a page inside a real TanStack Router so `Link`/`useNavigate` resolve.
 * The page is mounted at `/` with a catch-all child route so any `to` target
 * resolves without needing the full production route tree.
 */
export async function renderWithRouter(ui: ReactElement) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  const catchAllRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "$",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, catchAllRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

export function renderWithActor<K extends keyof backendInterface>(
  ui: ReactElement,
  actor: Pick<backendInterface, K>,
) {
  setActorForTest(actor);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
    queryClient,
  };
}

/**
 * Render a page inside both a QueryClient and a real router, with a typed
 * fake actor. Use for pages that call `Link`/`useNavigate` and the actor.
 */
export async function renderPageWithActor<K extends keyof backendInterface>(
  ui: ReactElement,
  actor: Pick<backendInterface, K>,
) {
  setActorForTest(actor);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
  });
  const catchAllRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "$",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, catchAllRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return {
    ...render(<RouterProvider router={router} />),
    queryClient,
  };
}
