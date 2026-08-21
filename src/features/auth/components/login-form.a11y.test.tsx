import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/components/login-form";

vi.mock("@/features/auth/server/auth-actions", () => ({
  login: vi.fn().mockResolvedValue({ error: null }),
}));

describe("LoginForm accessibility", () => {
  it("has no detectable violations", async () => {
    const { container } = render(<LoginForm next="/notes" />);

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
