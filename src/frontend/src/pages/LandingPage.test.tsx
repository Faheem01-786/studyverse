import { setIdentityForTest } from "@/__tests__/setup";
import { renderPageWithActor } from "@/__tests__/test-utils";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  it("renders the STUDYVERSE landing page with the tagline", async () => {
    await renderPageWithActor(<LandingPage />, {});

    expect(screen.getByText("STUDYVERSE")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Study Smart\.\s*Earn XP\.\s*Unlock Your World\./,
      }),
    ).toBeInTheDocument();
  });

  it("offers a sign-in path to a visitor", async () => {
    await renderPageWithActor(<LandingPage />, {});

    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows a dashboard entry point to an authenticated visitor", async () => {
    setIdentityForTest({
      identity: {
        getPrincipal: () => ({
          isAnonymous: () => false,
          toText: () => "aaaaa-aa",
        }),
      } as never,
    });
    await renderPageWithActor(<LandingPage />, {});

    expect(
      screen.getAllByRole("link", { name: /go to dashboard/i }).length,
    ).toBeGreaterThan(0);
  });
});
