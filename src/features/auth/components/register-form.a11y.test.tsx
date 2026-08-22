import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { RegisterForm } from "@/features/auth/components/register-form";

vi.mock("@/features/auth/server/auth-actions", () => ({
  signUp: vi.fn().mockResolvedValue({ error: null }),
}));

describe("RegisterForm accessibility", () => {
  it("has no detectable violations", async () => {
    const { container } = render(<RegisterForm />);

    await expect(axe(container)).resolves.toHaveNoViolations();
  });

  it("stays clean once the strength reading appears", async () => {
    const { container, getByLabelText } = render(<RegisterForm />);

    await userEvent.type(getByLabelText("Password"), "Marmalade4Toast");

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
