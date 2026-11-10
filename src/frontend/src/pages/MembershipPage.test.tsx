import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import MembershipPage from "./MembershipPage";

const PLANS = [
  {
    tier: "moderate",
    name: "Moderate",
    priceRupees: 20n,
    xpMultiplier: 2n,
    benefits: ["2X XP on verified sessions"],
  },
  {
    tier: "advanced",
    name: "Advanced",
    priceRupees: 50n,
    xpMultiplier: 3n,
    benefits: ["3X XP on verified sessions"],
  },
  {
    tier: "ultimate",
    name: "Ultimate",
    priceRupees: 99n,
    xpMultiplier: 5n,
    benefits: ["5X XP on verified sessions", "All premium themes"],
  },
];

const INACTIVE = { active: false, xpMultiplier: 1n };

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    listMembershipPlans: vi.fn(async () => PLANS.map((p) => ({ ...p }))),
    getMembership: vi.fn(async () => ({ ...INACTIVE })),
    beginMembershipPurchase: vi.fn(async (tier: string) => ({
      tier,
      status: "pending",
      paymentReference: "MEM-REF-1",
      startedAt: 0n,
    })),
    verifyMembershipPayment: vi.fn(async () => ({
      active: true,
      tier: "moderate",
      xpMultiplier: 2n,
      expiresAt: 0n,
    })),
    ...overrides,
  } as unknown as Pick<
    backendInterface,
    | "listMembershipPlans"
    | "getMembership"
    | "beginMembershipPurchase"
    | "verifyMembershipPayment"
  >;
}

describe("MembershipPage", () => {
  it("shows the three pricing cards with their prices and multipliers", async () => {
    await renderPageWithActor(<MembershipPage />, makeActor());

    expect(await screen.findByText("₹20")).toBeInTheDocument();
    expect(screen.getByText("₹50")).toBeInTheDocument();
    expect(screen.getByText("₹99")).toBeInTheDocument();
    expect(screen.getByText("2X XP multiplier")).toBeInTheDocument();
    expect(screen.getByText("3X XP multiplier")).toBeInTheDocument();
  });

  it("shows the free plan when no membership is active", async () => {
    await renderPageWithActor(<MembershipPage />, makeActor());

    expect(await screen.findByText("Free plan")).toBeInTheDocument();
    expect(screen.getByText("No active benefits")).toBeInTheDocument();
  });

  it("does not activate benefits on click alone; it asks for payment verification", async () => {
    const actor = makeActor();
    await renderPageWithActor(<MembershipPage />, actor);

    await userEvent.click(
      await screen.findByRole("button", { name: /choose moderate/i }),
    );

    await waitFor(() =>
      expect(actor.beginMembershipPurchase).toHaveBeenCalled(),
    );
    expect(
      await screen.findByText("Payment pending verification"),
    ).toBeInTheDocument();
    expect(actor.verifyMembershipPayment).not.toHaveBeenCalled();
  });

  it("verifies a payment reference and then shows the active membership with expiry", async () => {
    const actor = makeActor({
      getMembership: vi
        .fn()
        .mockResolvedValueOnce({ ...INACTIVE })
        .mockResolvedValue({
          active: true,
          tier: "moderate",
          xpMultiplier: 2n,
          expiresAt: 0n,
        }),
    });
    await renderPageWithActor(<MembershipPage />, actor);

    await userEvent.click(
      await screen.findByRole("button", { name: /choose moderate/i }),
    );
    const input = await screen.findByLabelText("Payment reference");
    await userEvent.clear(input);
    await userEvent.type(input, "UPI-4821-9930");
    await userEvent.click(
      screen.getByRole("button", { name: /verify payment/i }),
    );

    await waitFor(() =>
      expect(actor.verifyMembershipPayment).toHaveBeenCalledWith(
        "UPI-4821-9930",
      ),
    );
    expect(await screen.findByText("Moderate member")).toBeInTheDocument();
    expect(
      screen.getByText("2X XP on every verified session"),
    ).toBeInTheDocument();
  });

  it("shows an empty state when no plans are published", async () => {
    await renderPageWithActor(
      <MembershipPage />,
      makeActor({ listMembershipPlans: vi.fn(async () => []) }),
    );

    expect(
      await screen.findByText("No plans available yet"),
    ).toBeInTheDocument();
  });
});
