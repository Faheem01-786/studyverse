import { RequireSignIn } from "@/components/InternetIdentity";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { AppShell } from "@/components/layout/AppShell";
import AchievementsPage from "@/pages/AchievementsPage";
import AdminPage from "@/pages/AdminPage";
import DashboardPage from "@/pages/DashboardPage";
import LandingPage from "@/pages/LandingPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import LibraryPage from "@/pages/LibraryPage";
import MembershipPage from "@/pages/MembershipPage";
import ProfilePage from "@/pages/ProfilePage";
import QuestsPage from "@/pages/QuestsPage";
import SignInPage from "@/pages/SignInPage";
import StorePage from "@/pages/StorePage";
import StudyRoomPage from "@/pages/StudyRoomPage";
import ThemesPage from "@/pages/ThemesPage";
import WebsiteHubPage from "@/pages/WebsiteHubPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute();

/** Public landing page. */
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

/** Public sign-in page. */
const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  component: SignInPage,
});

/** Authenticated shell: gates every student and admin route behind sign-in. */
function ProtectedLayout() {
  return (
    <RequireSignIn>
      <AppShell>
        <Outlet />
      </AppShell>
    </RequireSignIn>
  );
}

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: ProtectedLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const studyRoomRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/study-room",
  component: StudyRoomPage,
});

const questsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/quests",
  component: QuestsPage,
});

const storeRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/store",
  component: StorePage,
});

const membershipRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/membership",
  component: MembershipPage,
});

const themesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/themes",
  component: ThemesPage,
});

const libraryRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/library",
  component: LibraryPage,
});

const websiteHubRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/website-hub",
  component: WebsiteHubPage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/leaderboard",
  component: LeaderboardPage,
});

const achievementsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/achievements",
  component: AchievementsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/profile",
  component: ProfilePage,
});

/** Admin route: additionally gated to authorized administrators. */
const adminRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/admin",
  component: () => (
    <AdminRoute>
      <AdminPage />
    </AdminRoute>
  ),
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  signInRoute,
  protectedRoute.addChildren([
    dashboardRoute,
    studyRoomRoute,
    questsRoute,
    storeRoute,
    membershipRoute,
    themesRoute,
    libraryRoute,
    websiteHubRoute,
    leaderboardRoute,
    achievementsRoute,
    profileRoute,
    adminRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
