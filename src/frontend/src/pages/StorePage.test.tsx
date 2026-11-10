import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import StorePage from "./StorePage";

const PROFILE = {
  id: { toText: () => "aaaaa-aa" } as never,
  xp: 100n,
  bio: "",
  username: "aarav",
  avatarItemId: [] as [],
  displayName: "Aarav Sharma",
  createdAt: 0n,
  level: 3n,
  appliedThemeId: 0n,
  updatedAt: 0n,
  frameItemId: [] as [],
};

const ITEM = {
  id: 1n,
  active: true,
  kind: "badge" as const,
  name: "Focus Badge",
  createdAt: 0n,
  description: "A badge for focused students",
  xpPrice: 40n,
};

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    listStoreItems: vi.fn(async () => [{ item: { ...ITEM }, owned: false }]),
    getPurchaseHistory: vi.fn(async () => []),
    getCallerProfile: vi.fn(async () => ({ ...PROFILE })),
    purchaseStoreItem: vi.fn(async () => ({
      id: 1n,
      itemId: 1n,
      owner: PROFILE.id,
      xpSpent: 40n,
      purchasedAt: 0n,
    })),
    ...overrides,
  } as unknown as Pick<
    backendInterface,
    | "listStoreItems"
    | "getPurchaseHistory"
    | "getCallerProfile"
    | "purchaseStoreItem"
  >;
}

describe("StorePage", () => {
  it("shows the balance and catalogue with XP prices", async () => {
    await renderPageWithActor(<StorePage />, makeActor());

    expect(await screen.findByText("100 XP")).toBeInTheDocument();
    expect(screen.getByText("Focus Badge")).toBeInTheDocument();
    expect(screen.getByText("40 XP")).toBeInTheDocument();
  });

  it("confirms a purchase before spending XP and reports success", async () => {
    const actor = makeActor();
    await renderPageWithActor(<StorePage />, actor);

    await userEvent.click(
      await screen.findByRole("button", { name: /^buy$/i }),
    );
    expect(
      await screen.findByRole("heading", { name: "Confirm purchase" }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Confirm purchase" }),
    );

    await waitFor(() =>
      expect(actor.purchaseStoreItem).toHaveBeenCalledWith(1n),
    );
    expect(
      await screen.findByText(/Purchased “Focus Badge” for 40 XP/),
    ).toBeInTheDocument();
  });

  it("shows a clear error when the balance is insufficient", async () => {
    const actor = makeActor({
      purchaseStoreItem: vi.fn(async () => {
        throw new Error("Not enough XP to purchase this item");
      }),
    });
    await renderPageWithActor(<StorePage />, actor);

    await userEvent.click(
      await screen.findByRole("button", { name: /^buy$/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /confirm purchase/i }),
    );

    expect(
      await screen.findByText("Not enough XP for this purchase."),
    ).toBeInTheDocument();
  });

  it("marks an owned item and disables buying it again", async () => {
    await renderPageWithActor(
      <StorePage />,
      makeActor({
        listStoreItems: vi.fn(async () => [{ item: { ...ITEM }, owned: true }]),
      }),
    );

    expect(await screen.findByText("Owned")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^buy$/i }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state when the store has no items", async () => {
    await renderPageWithActor(
      <StorePage />,
      makeActor({ listStoreItems: vi.fn(async () => []) }),
    );

    expect(
      await screen.findByText("The store is being stocked"),
    ).toBeInTheDocument();
  });
});
