import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "./DashboardPage";

const PROFILE = {
  id: { toText: () => "aaaaa-aa" } as never,
  xp: 1240n,
  bio: "",
  username: "aarav",
  avatarItemId: [] as [],
  displayName: "Aarav Sharma",
  createdAt: 0n,
  level: 12n,
  appliedThemeId: 0n,
  updatedAt: 0n,
  frameItemId: [] as [],
};

/** A fresh dashboard snapshot per call, as a real remote actor returns. */
function makeDashboard() {
  return {
    goal: {
      currentStreakDays: 14n,
      lastStudyDay: [] as [],
      longestStreakDays: 21n,
      dailyGoalMinutes: 120n,
    },
    levelProgressPercent: 80n,
    xpThisWeek: 500n,
    studyMinutesThisWeek: 300n,
    studyMinutesToday: 80n,
    xpToNextLevel: 260n,
    xpToday: 40n,
    profile: { ...PROFILE },
  };
}

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    getDashboard: vi.fn(async () => makeDashboard()),
    getWeekDailyTotals: vi.fn(async () => []),
    listDailyQuests: vi.fn(async () => []),
    listAchievements: vi.fn(async () => []),
    searchResources: vi.fn(async () => []),
    ...overrides,
  } as unknown as Pick<
    backendInterface,
    | "getDashboard"
    | "getWeekDailyTotals"
    | "listDailyQuests"
    | "listAchievements"
    | "searchResources"
  >;
}

describe("DashboardPage", () => {
  it("shows the welcome message, XP, level, goal, streak and weekly stats", async () => {
    await renderPageWithActor(<DashboardPage />, makeActor());

    expect(
      await screen.findByRole("heading", {
        name: /Welcome back, Aarav Sharma/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Level 12")).toBeInTheDocument();
    expect(screen.getByText("1,240 XP total")).toBeInTheDocument();
    expect(screen.getByText("14 days")).toBeInTheDocument();
    expect(screen.getAllByText("1h 20m").length).toBeGreaterThan(0);
  });

  it("shows an empty state when there are no quests or achievements", async () => {
    await renderPageWithActor(<DashboardPage />, makeActor());

    expect(await screen.findByText("No quests today")).toBeInTheDocument();
    expect(screen.getByText("No achievements yet")).toBeInTheDocument();
  });

  it("shows an error state when the dashboard fails to load", async () => {
    await renderPageWithActor(
      <DashboardPage />,
      makeActor({
        getDashboard: vi.fn(async () => {
          throw new Error("boom");
        }),
      }),
    );

    expect(
      await screen.findByText("Could not load this section"),
    ).toBeInTheDocument();
  });

  it("renders quests with a progress bar and XP reward", async () => {
    await renderPageWithActor(
      <DashboardPage />,
      makeActor({
        listDailyQuests: vi.fn(async () => [
          {
            quest: {
              id: 1n,
              title: "Study 30 minutes",
              active: true,
              xpReward: 20n,
              goal: { studyMinutes: 30n },
              createdAt: 0n,
              description: "Focus for half an hour",
            },
            completed: false,
            claimed: false,
            progress: 15n,
            target: 30n,
          },
        ]),
      }),
    );

    expect(await screen.findByText("Study 30 minutes")).toBeInTheDocument();
    expect(screen.getByText("15/30")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByLabelText("Study 30 minutes progress 50%"),
      ).toBeInTheDocument(),
    );
  });
});
