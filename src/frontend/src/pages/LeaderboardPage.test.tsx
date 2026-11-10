import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LeaderboardPage from "./LeaderboardPage";

function entry(rank: number, name: string, xp: bigint, level: bigint) {
  return {
    rank: BigInt(rank),
    username: name.toLowerCase().replace(/\s+/g, ""),
    displayName: name,
    xp,
    level,
    student: { toText: () => `principal-${rank}` },
  };
}

const GLOBAL = [
  entry(1, "Aarav Sharma", 1240n, 12n),
  entry(2, "Diya Patel", 980n, 9n),
];

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    getLeaderboard: vi.fn(async (scope: string) =>
      scope === "friends" ? [] : GLOBAL.map((e) => ({ ...e })),
    ),
    getCallerProfile: vi.fn(async () => ({
      id: { toText: () => "principal-self" },
      username: "self",
      displayName: "Self Student",
      xp: 10n,
      level: 1n,
      bio: "",
      createdAt: 0n,
      updatedAt: 0n,
      appliedThemeId: 0n,
      avatarItemId: [] as [],
      frameItemId: [] as [],
    })),
    addFriend: vi.fn(async () => undefined),
    removeFriend: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as Pick<
    backendInterface,
    "getLeaderboard" | "getCallerProfile" | "addFriend" | "removeFriend"
  >;
}

describe("LeaderboardPage", () => {
  it("shows the four leaderboard scopes", async () => {
    await renderPageWithActor(<LeaderboardPage />, makeActor());

    expect(
      await screen.findByRole("tab", { name: "Global" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Weekly" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Monthly" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Friends" })).toBeInTheDocument();
  });

  it("shows username, level and XP for each ranked student", async () => {
    await renderPageWithActor(<LeaderboardPage />, makeActor());

    expect(await screen.findByText("Aarav Sharma")).toBeInTheDocument();
    expect(screen.getByText("@aaravsharma")).toBeInTheDocument();
    expect(screen.getByText("1,240")).toBeInTheDocument();
    expect(screen.getByText("Level 12")).toBeInTheDocument();
  });

  it("queries the backend for the selected scope", async () => {
    const actor = makeActor();
    await renderPageWithActor(<LeaderboardPage />, actor);

    await screen.findByText("Aarav Sharma");
    expect(actor.getLeaderboard).toHaveBeenCalledWith("global", 50n);
  });

  it("shows a friends empty state when the friends board is empty", async () => {
    await renderPageWithActor(<LeaderboardPage />, makeActor());

    await screen.findByText("Aarav Sharma");
    await userEvent.click(screen.getByRole("tab", { name: "Friends" }));

    expect(await screen.findByText("No friends yet")).toBeInTheDocument();
  });
});
