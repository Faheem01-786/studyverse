import { setIdentityForTest } from "@/__tests__/setup";
import { renderPageWithActor } from "@/__tests__/test-utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SignInPage from "./SignInPage";

// SignInPage renders SignInButton, which reads the QueryClient context, so the
// page is mounted through the QueryClient-aware helper with an unused actor.
const noActor = {} as never;

describe("SignInPage", () => {
  it("shows the sign-in action and recovery guidance to a visitor", async () => {
    await renderPageWithActor(<SignInPage />, noActor);

    expect(
      await screen.findByRole("button", {
        name: "Sign in with Internet Identity",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "recover your identity" }),
    ).toHaveAttribute("href", "https://identity.ic0.app");
  });

  it("starts the Internet Identity login when the button is clicked", async () => {
    const login = vi.fn();
    setIdentityForTest({ login });
    await renderPageWithActor(<SignInPage />, noActor);

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Sign in with Internet Identity",
      }),
    );

    expect(login).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state while the session is being checked", async () => {
    setIdentityForTest({ loginStatus: "initializing" });
    await renderPageWithActor(<SignInPage />, noActor);

    expect(
      await screen.findByText("Checking your session…"),
    ).toBeInTheDocument();
  });

  it("shows a clear error when sign-in fails", async () => {
    setIdentityForTest({ loginStatus: "loginError" });
    await renderPageWithActor(<SignInPage />, noActor);

    expect(await screen.findByTestId("signin.error_state")).toHaveTextContent(
      "We couldn't complete sign-in. Please try again.",
    );
  });
});
