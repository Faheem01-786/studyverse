import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AchievementsPage from "./AchievementsPage";

const VIEWS = [
  {
    achievement: {
      key: "firstStudySession",
      title: "First Study Session",
      description: "Finish your first session",
      xpReward: 20n,
    },
    earned: true,
    earnedAt: 0n,
  },
  {
    achievement: {
      key: "fiveHourLearner",
      title: "5-Hour Learner",
      description: "Study for five hours",
      xpReward: 50n,
    },
    earned: false,
  },
  {
    achievement: {
      key: "sevenDayStreak",
      title: "7-Day Streak",
      description: "Study seven days in a row",
      xpReward: 70n,
    },
    earned: false,
  },
];

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    listAchievements: vi.fn(async () => VIEWS.map((v) => ({ ...v }))),
    ...overrides,
  } as unknown as Pick<backendInterface, "listAchievements">;
}

describe("AchievementsPage", () => {
  it("shows each achievement with its locked or unlocked state", async () => {
    await renderPageWithActor(<AchievementsPage />, makeActor());

    expect(await screen.findByText("First Study Session")).toBeInTheDocument();
    expect(screen.getByText("5-Hour Learner")).toBeInTheDocument();
    expect(screen.getByText("7-Day Streak")).toBeInTheDocument();
    expect(screen.getByText("Unlocked")).toBeInTheDocument();
    expect(screen.getAllByText("Locked").length).toBe(2);
  });

  it("summarises how many badges are earned", async () => {
    await renderPageWithActor(<AchievementsPage />, makeActor());

    expect(await screen.findByText("Badges earned")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("/ 3")).toBeInTheDocument();
  });

  it("shows an empty state when no achievements are configured", async () => {
    await renderPageWithActor(
      <AchievementsPage />,
      makeActor({ listAchievements: vi.fn(async () => []) }),
    );

    expect(
      await screen.findByText("No achievements available yet"),
    ).toBeInTheDocument();
  });
});
