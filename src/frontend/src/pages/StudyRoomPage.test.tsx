import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import StudyRoomPage from "./StudyRoomPage";

const GOAL = {
  currentStreakDays: 3n,
  lastStudyDay: [] as [],
  longestStreakDays: 5n,
  dailyGoalMinutes: 120n,
};

const EMPTY_REPORT = {
  totalXp: 0n,
  bySubject: [] as Array<[string, bigint]>,
  sessionCount: 0n,
  totalMinutes: 0n,
};

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    listStudySessions: vi.fn(async () => []),
    getGoal: vi.fn(async () => ({ ...GOAL })),
    getDailyReport: vi.fn(async () => ({ ...EMPTY_REPORT })),
    getWeeklyReport: vi.fn(async () => ({ ...EMPTY_REPORT })),
    getWeekDailyTotals: vi.fn(async () => []),
    startStudySession: vi.fn(async (subject: string) => ({
      id: 1n,
      status: "running",
      startedAt: 0n,
      subject,
      accumulatedSeconds: 0n,
    })),
    pauseStudySession: vi.fn(async () => ({
      id: 1n,
      status: "paused",
      startedAt: 0n,
      subject: "Mathematics",
      accumulatedSeconds: 60n,
    })),
    resumeStudySession: vi.fn(async () => ({
      id: 1n,
      status: "running",
      startedAt: 0n,
      subject: "Mathematics",
      accumulatedSeconds: 60n,
    })),
    finishStudySession: vi.fn(async () => ({
      id: 1n,
      status: "finished",
      startedAt: 0n,
      subject: "Mathematics",
      rewardedXp: 20n,
      finishedAt: 1800n,
      accumulatedSeconds: 1800n,
    })),
    setDailyGoal: vi.fn(async () => ({ ...GOAL })),
    ...overrides,
  } as unknown as Pick<
    backendInterface,
    | "listStudySessions"
    | "getGoal"
    | "getDailyReport"
    | "getWeeklyReport"
    | "getWeekDailyTotals"
    | "startStudySession"
    | "pauseStudySession"
    | "resumeStudySession"
    | "finishStudySession"
    | "setDailyGoal"
  >;
}

describe("StudyRoomPage", () => {
  it("starts a session with the selected subject", async () => {
    const actor = makeActor();
    await renderPageWithActor(<StudyRoomPage />, actor);

    const start = await screen.findByRole("button", {
      name: /start session/i,
    });
    await userEvent.click(start);

    await waitFor(() =>
      expect(actor.startStudySession).toHaveBeenCalledWith("Mathematics"),
    );
  });

  it("pauses a running session", async () => {
    const actor = makeActor({
      listStudySessions: vi.fn(async () => [
        {
          id: 1n,
          status: "running",
          startedAt: 0n,
          subject: "Mathematics",
          accumulatedSeconds: 0n,
        },
      ]),
    });
    await renderPageWithActor(<StudyRoomPage />, actor);

    const pause = await screen.findByRole("button", { name: /^pause$/i });
    await userEvent.click(pause);

    await waitFor(() =>
      expect(actor.pauseStudySession).toHaveBeenCalledWith(1n),
    );
  });

  it("finishes a session and reveals the server-awarded XP", async () => {
    const actor = makeActor({
      listStudySessions: vi.fn(async () => [
        {
          id: 1n,
          status: "running",
          startedAt: 0n,
          subject: "Mathematics",
          accumulatedSeconds: 1800n,
        },
      ]),
    });
    await renderPageWithActor(<StudyRoomPage />, actor);

    const finish = await screen.findByRole("button", { name: /finish/i });
    await userEvent.click(finish);

    await waitFor(() =>
      expect(actor.finishStudySession).toHaveBeenCalledWith(1n),
    );
    expect(
      await screen.findByText(/You earned 20 XP for this verified session/),
    ).toBeInTheDocument();
  });

  it("shows an empty history state when there are no finished sessions", async () => {
    await renderPageWithActor(<StudyRoomPage />, makeActor());

    expect(
      await screen.findByText("No finished sessions yet"),
    ).toBeInTheDocument();
  });

  it("lists a finished session in the history with its XP", async () => {
    await renderPageWithActor(
      <StudyRoomPage />,
      makeActor({
        listStudySessions: vi.fn(async () => [
          {
            id: 7n,
            status: "finished",
            startedAt: 0n,
            subject: "Physics",
            rewardedXp: 50n,
            finishedAt: 3600n,
            accumulatedSeconds: 3600n,
          },
        ]),
      }),
    );

    expect(await screen.findByText("Physics")).toBeInTheDocument();
    expect(screen.getByText("50 XP")).toBeInTheDocument();
  });
});
