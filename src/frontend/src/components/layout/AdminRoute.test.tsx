import { renderPageWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

function makeActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
) {
  return {
    isCallerAdmin: vi.fn(async () => false),
    ...overrides,
  } as unknown as Pick<backendInterface, "isCallerAdmin">;
}

describe("AdminRoute", () => {
  it("blocks a non-admin from the admin area", async () => {
    await renderPageWithActor(
      <AdminRoute>
        <div>Secret admin panel</div>
      </AdminRoute>,
      makeActor({ isCallerAdmin: vi.fn(async () => false) }),
    );

    expect(await screen.findByText("Administrators only")).toBeInTheDocument();
    expect(screen.queryByText("Secret admin panel")).not.toBeInTheDocument();
  });

  it("renders the admin area for an authorized administrator", async () => {
    await renderPageWithActor(
      <AdminRoute>
        <div>Secret admin panel</div>
      </AdminRoute>,
      makeActor({ isCallerAdmin: vi.fn(async () => true) }),
    );

    expect(await screen.findByText("Secret admin panel")).toBeInTheDocument();
    expect(screen.queryByText("Administrators only")).not.toBeInTheDocument();
  });
});
