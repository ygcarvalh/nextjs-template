import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/components/login-form";
import { login } from "@/features/auth/server/auth-actions";

vi.mock("@/features/auth/server/auth-actions", () => ({
  login: vi.fn(),
}));

const loginMock = vi.mocked(login);

describe("LoginForm", () => {
  beforeEach(() => {
    loginMock.mockReset();
    loginMock.mockResolvedValue({ error: null });
  });

  it("labels both fields and the submit control", () => {
    render(<LoginForm next="/notes" />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("carries the redirect target through a hidden field", () => {
    const { container } = render(<LoginForm next="/notes?filter=recent" />);

    expect(container.querySelector('input[name="next"]')).toHaveValue("/notes?filter=recent");
  });

  it("submits the entered credentials", async () => {
    render(<LoginForm next="/notes" />);

    await userEvent.type(screen.getByLabelText("Email"), "demo@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "demo-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(loginMock).toHaveBeenCalledTimes(1);
    const formData = loginMock.mock.calls[0][1];
    expect(formData.get("email")).toBe("demo@example.com");
    expect(formData.get("password")).toBe("demo-password");
    expect(formData.get("next")).toBe("/notes");
  });

  it("announces a rejected sign-in", async () => {
    loginMock.mockResolvedValue({ error: "Those credentials don't match an account." });
    render(<LoginForm next="/notes" />);

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Those credentials don't match an account.");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Those credentials don't match an account.",
    );
  });
});
