import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ThemesPage from "./ThemesPage";

const CSS = "--background: 0.2 0.05 300; --primary: 0.62 0.24 300;";

function theme(id: number, name: string, premium: boolean) {
  return {
    id: BigInt(id),
    name,
    description: `${name} description`,
    premium,
    createdAt: 0n,
    cssVariables: CSS,
  };
}

const THEMES = [
  { theme: theme(1, "Default Purple", false), applied: true, unlocked: true },
  { theme: theme(2, "Neon Cyberpunk", false), applied: false, unlocked: true },
  { theme: theme(3, "Anime Dark", false), applied: false, unlocked: true },
  { theme: theme(4, "Shadow Monarch", true), applied: false, unlocked: false },
  { theme: theme(5, "Violet Galaxy", true), applied: false, unlocked: false },
  { theme: theme(6, "Minimal Black", false), applied: false, unlocked: true },
  { theme: theme(7, "Custom Gradient", true), applied: false, unlocked: false },
];

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    listThemes: vi.fn(async () => THEMES.map((t) => ({ ...t }))),
    getMembership: vi.fn(async () => ({ active: false, xpMultiplier: 1n })),
    applyTheme: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as Pick<
    backendInterface,
    "listThemes" | "getMembership" | "applyTheme"
  >;
}

describe("ThemesPage", () => {
  it("lists all seven themes", async () => {
    await renderPageWithActor(<ThemesPage />, makeActor());

    for (const name of [
      "Default Purple",
      "Neon Cyberpunk",
      "Anime Dark",
      "Shadow Monarch",
      "Violet Galaxy",
      "Minimal Black",
      "Custom Gradient",
    ]) {
      expect(await screen.findByText(name)).toBeInTheDocument();
    }
  });

  it("locks premium themes for a non-ULTIMATE member", async () => {
    await renderPageWithActor(<ThemesPage />, makeActor());

    expect(await screen.findByText("Free plan")).toBeInTheDocument();
    await screen.findByText("Shadow Monarch");
    expect(
      screen.getAllByRole("link", { name: /unlock with ultimate/i }).length,
    ).toBe(3);
    expect(screen.getAllByRole("button", { name: /apply theme/i }).length).toBe(
      3,
    );
  });

  it("applies an unlocked theme instantly", async () => {
    const actor = makeActor();
    await renderPageWithActor(<ThemesPage />, actor);

    const applyButtons = await screen.findAllByRole("button", {
      name: /apply theme/i,
    });
    await userEvent.click(applyButtons[0]);

    await waitFor(() => expect(actor.applyTheme).toHaveBeenCalledWith(2n));
  });

  it("previews a theme without applying it", async () => {
    const actor = makeActor();
    await renderPageWithActor(<ThemesPage />, actor);

    const previewButtons = await screen.findAllByRole("button", {
      name: /^preview$/i,
    });
    await userEvent.click(previewButtons[1]);

    expect(
      await screen.findByText(/this is a live preview, not yet saved/i),
    ).toBeInTheDocument();
    expect(actor.applyTheme).not.toHaveBeenCalled();
  });

  it("shows an empty state when no themes exist", async () => {
    await renderPageWithActor(
      <ThemesPage />,
      makeActor({ listThemes: vi.fn(async () => []) }),
    );

    expect(
      await screen.findByText("No themes available yet"),
    ).toBeInTheDocument();
  });
});
