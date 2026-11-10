import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WebsiteHubPage from "./WebsiteHubPage";

const LINKS = [
  {
    id: 1n,
    name: "NCERT",
    url: "https://ncert.nic.in",
    description: "Official NCERT textbooks",
    category: "NCERT",
    createdAt: 0n,
  },
  {
    id: 2n,
    name: "Khan Academy",
    url: "https://khanacademy.org",
    description: "Free practice and lessons",
    category: "Practice",
    createdAt: 0n,
  },
];

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    listWebsiteLinks: vi.fn(async () => LINKS.map((l) => ({ ...l }))),
    ...overrides,
  } as unknown as Pick<backendInterface, "listWebsiteLinks">;
}

describe("WebsiteHubPage", () => {
  it("lists the educational shortcuts", async () => {
    await renderPageWithActor(<WebsiteHubPage />, makeActor());

    expect(await screen.findByText("Khan Academy")).toBeInTheDocument();
    expect(screen.getAllByText("NCERT").length).toBeGreaterThan(0);
  });

  it("opens each shortcut in a new tab with a safe rel", async () => {
    await renderPageWithActor(<WebsiteHubPage />, makeActor());

    const link = await screen.findByRole("link", { name: /khan academy/i });
    expect(link).toHaveAttribute("href", "https://khanacademy.org/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows an empty state when no shortcuts exist", async () => {
    await renderPageWithActor(
      <WebsiteHubPage />,
      makeActor({ listWebsiteLinks: vi.fn(async () => []) }),
    );

    expect(await screen.findByText("No shortcuts yet")).toBeInTheDocument();
  });
});
