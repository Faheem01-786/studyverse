import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProfilePage from "./ProfilePage";

const PROFILE = {
  id: { toText: () => "aaaaa-aa" } as never,
  xp: 120n,
  bio: "Studying for finals",
  username: "aarav",
  avatarItemId: [] as [],
  displayName: "Aarav Sharma",
  createdAt: 0n,
  level: 1n,
  appliedThemeId: 0n,
  updatedAt: 0n,
  frameItemId: [] as [],
};

const MEMBERSHIP = {
  active: false,
  expiresAt: [] as [],
  xpMultiplier: 1n,
  tier: [] as [],
};

const THEME = {
  id: 0n,
  premium: false,
  name: "Default Purple",
  createdAt: 0n,
  description: "The default look",
  cssVariables: "",
};

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    getCallerProfile: vi.fn(async () => ({ ...PROFILE })),
    getMembership: vi.fn(async () => ({ ...MEMBERSHIP })),
    listStoreItems: vi.fn(async () => []),
    getPurchaseHistory: vi.fn(async () => []),
    listThemes: vi.fn(async () => [
      { theme: { ...THEME }, applied: true, unlocked: true },
    ]),
    createProfile: vi.fn(async () => ({ ...PROFILE })),
    updateProfile: vi.fn(async () => ({ ...PROFILE })),
    ...overrides,
  } as unknown as Pick<
    backendInterface,
    | "getCallerProfile"
    | "getMembership"
    | "listStoreItems"
    | "getPurchaseHistory"
    | "listThemes"
    | "createProfile"
    | "updateProfile"
  >;
}

describe("ProfilePage", () => {
  it("shows the signed-in student's identity, XP and level", async () => {
    await renderPageWithActor(<ProfilePage />, makeActor());

    expect((await screen.findAllByText("Aarav Sharma")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("@aarav")).toBeInTheDocument();
    expect(screen.getByText("120 XP")).toBeInTheDocument();
    expect(screen.getAllByText("Studying for finals").length).toBeGreaterThan(
      0,
    );
  });

  it("prompts a first-time student to create a profile", async () => {
    await renderPageWithActor(
      <ProfilePage />,
      makeActor({ getCallerProfile: vi.fn(async () => null) }),
    );

    expect(await screen.findByText("Create your profile")).toBeInTheDocument();
  });

  it("validates the create-profile form before submitting", async () => {
    const actor = makeActor({ getCallerProfile: vi.fn(async () => null) });
    await renderPageWithActor(<ProfilePage />, actor);

    await userEvent.click(
      await screen.findByRole("button", { name: /create profile/i }),
    );

    expect(
      await screen.findByText("Username must be at least 3 characters."),
    ).toBeInTheDocument();
    expect(actor.createProfile).not.toHaveBeenCalled();
  });

  it("saves an edited display name through the actor", async () => {
    const actor = makeActor();
    await renderPageWithActor(<ProfilePage />, actor);

    await userEvent.click(
      await screen.findByRole("button", { name: /^edit$/i }),
    );
    const input = screen.getByLabelText("Display name");
    await userEvent.clear(input);
    await userEvent.type(input, "Aarav S");
    await userEvent.click(
      screen.getByRole("button", { name: /save changes/i }),
    );

    expect(actor.updateProfile).toHaveBeenCalledWith(
      "Aarav S",
      "Studying for finals",
    );
  });

  it("shows an empty state when the student owns no items", async () => {
    await renderPageWithActor(<ProfilePage />, makeActor());

    expect(await screen.findByText("No items yet")).toBeInTheDocument();
    expect(screen.getByText("No purchases yet")).toBeInTheDocument();
  });
});
