import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import QuestsPage from "./QuestsPage";

function questView(
  id: number,
  title: string,
  opts: {
    completed: boolean;
    claimed: boolean;
    progress: bigint;
    target: bigint;
  },
) {
  return {
    completed: opts.completed,
    claimed: opts.claimed,
    progress: opts.progress,
    target: opts.target,
    quest: {
      id: BigInt(id),
      title,
      description: `${title} description`,
      active: true,
      xpReward: 30n,
      goal: { __kind__: "studyMinutes" as const, studyMinutes: 30n },
      createdAt: 0n,
    },
  };
}

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    listDailyQuests: vi.fn(async () => [
      questView(1, "Focus Sprint", {
        completed: true,
        claimed: false,
        progress: 30n,
        target: 30n,
      }),
      questView(2, "Warm Up", {
        completed: false,
        claimed: false,
        progress: 10n,
        target: 30n,
      }),
    ]),
    claimQuestReward: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as Pick<
    backendInterface,
    "listDailyQuests" | "claimQuestReward"
  >;
}

describe("QuestsPage", () => {
  it("shows quests with progress, reward and completion status", async () => {
    await renderPageWithActor(<QuestsPage />, makeActor());

    expect(await screen.findByText("Focus Sprint")).toBeInTheDocument();
    expect(screen.getByText("Warm Up")).toBeInTheDocument();
    expect(screen.getAllByText("30 XP").length).toBeGreaterThan(0);
    expect(screen.getByText("10 / 30")).toBeInTheDocument();
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("claims a completed quest's reward exactly once", async () => {
    const actor = makeActor();
    await renderPageWithActor(<QuestsPage />, actor);

    const claim = await screen.findByTestId("quests.claim_button.1");
    await userEvent.click(claim);

    await waitFor(() =>
      expect(actor.claimQuestReward).toHaveBeenCalledWith(1n),
    );
    expect(actor.claimQuestReward).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(/Reward claimed — 30 XP added to your total/),
    ).toBeInTheDocument();
  });

  it("disables the claim button for an incomplete quest", async () => {
    await renderPageWithActor(<QuestsPage />, makeActor());

    const claimable = await screen.findByTestId("quests.claim_button.1");
    const locked = await screen.findByTestId("quests.claim_button.2");
    expect(claimable).toBeEnabled();
    expect(locked).toBeDisabled();
  });

  it("shows an empty state when there are no quests today", async () => {
    await renderPageWithActor(
      <QuestsPage />,
      makeActor({ listDailyQuests: vi.fn(async () => []) }),
    );

    expect(
      await screen.findByText("No quests available today"),
    ).toBeInTheDocument();
  });
});
