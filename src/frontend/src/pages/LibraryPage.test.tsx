import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LibraryPage from "./LibraryPage";

function resource(id: number, title: string, subject: string) {
  return {
    id: BigInt(id),
    title,
    subject,
    description: `${title} description`,
    fileName: `${title}.pdf`,
    category: "Notes",
    classLevel: "Class 10",
    board: "CBSE",
    downloadCount: 3n,
    createdAt: 0n,
    file: { getDirectURL: () => `https://example.com/${id}.pdf` },
  };
}

const RESOURCES = [
  resource(1, "Physics Notes", "Physics"),
  resource(2, "Maths Notes", "Mathematics"),
];

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    searchResources: vi.fn(async () => RESOURCES.map((r) => ({ ...r }))),
    recordResourceDownload: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as Pick<
    backendInterface,
    "searchResources" | "recordResourceDownload"
  >;
}

describe("LibraryPage", () => {
  it("lists resources returned by the search", async () => {
    await renderPageWithActor(<LibraryPage />, makeActor());

    expect(await screen.findByText("Physics Notes")).toBeInTheDocument();
    expect(screen.getByText("Maths Notes")).toBeInTheDocument();
  });

  it("passes the typed search term to the backend filter", async () => {
    const actor = makeActor();
    await renderPageWithActor(<LibraryPage />, actor);

    await userEvent.type(
      await screen.findByLabelText("Search study resources"),
      "physics",
    );

    await waitFor(() =>
      expect(actor.searchResources).toHaveBeenCalledWith(
        expect.objectContaining({ searchTerm: "physics" }),
      ),
    );
  });

  it("opens a resource in the PDF viewer", async () => {
    await renderPageWithActor(<LibraryPage />, makeActor());

    await userEvent.click(await screen.findByTestId("library.open_button.1"));

    expect(
      await screen.findByTestId("library.viewer_modal"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("library.viewer_frame")).toHaveAttribute(
      "src",
      "https://example.com/1.pdf",
    );
  });

  it("records a download when the download button is used", async () => {
    const actor = makeActor();
    await renderPageWithActor(<LibraryPage />, actor);

    await userEvent.click(
      await screen.findByTestId("library.download_button.1"),
    );

    await waitFor(() =>
      expect(actor.recordResourceDownload).toHaveBeenCalledWith(1n),
    );
  });

  it("shows an empty state when no resources match", async () => {
    await renderPageWithActor(
      <LibraryPage />,
      makeActor({ searchResources: vi.fn(async () => []) }),
    );

    expect(
      await screen.findByText("No resources match your filters"),
    ).toBeInTheDocument();
  });
});
