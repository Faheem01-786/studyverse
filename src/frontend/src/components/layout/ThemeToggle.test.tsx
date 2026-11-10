import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

const STORAGE_KEY = "grimoire-color-mode";

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to dark mode and reflects it on the document", async () => {
    render(<ThemeToggle />);

    const toggle = await screen.findByRole("button", {
      name: "Switch to light mode",
    });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles to light mode and persists the choice", async () => {
    render(<ThemeToggle />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Switch to light mode" }),
    );

    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("restores a persisted light-mode choice on mount", async () => {
    window.localStorage.setItem(STORAGE_KEY, "light");
    render(<ThemeToggle />);

    expect(
      await screen.findByRole("button", { name: "Switch to dark mode" }),
    ).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
