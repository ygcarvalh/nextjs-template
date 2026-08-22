import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "@/features/auth/components/register-form";
import { signUp } from "@/features/auth/server/auth-actions";

vi.mock("@/features/auth/server/auth-actions", () => ({
  signUp: vi.fn(),
}));

const signUpMock = vi.mocked(signUp);

describe("RegisterForm", () => {
  beforeEach(() => {
    signUpMock.mockReset();
    signUpMock.mockResolvedValue({ error: null });
  });

  it("labels every field and the submit control", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Name (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Repeat password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });

  it("submits everything the newcomer typed", async () => {
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Name (optional)"), "Ada");
    await userEvent.type(screen.getByLabelText("Password"), "Marmalade4Toast");
    await userEvent.type(screen.getByLabelText("Repeat password"), "Marmalade4Toast");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(signUpMock).toHaveBeenCalledTimes(1);
    const formData = signUpMock.mock.calls[0][1];
    expect(formData.get("email")).toBe("ada@example.com");
    expect(formData.get("name")).toBe("Ada");
    expect(formData.get("password")).toBe("Marmalade4Toast");
    expect(formData.get("confirmation")).toBe("Marmalade4Toast");
  });

  it("says nothing about strength while the box is empty", () => {
    render(<RegisterForm />);

    expect(screen.queryByText(/Password strength/)).not.toBeInTheDocument();
  });

  it("rates the password while it is being typed", async () => {
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText("Password"), "marmalade");
    expect(screen.getByText("Password strength: Weak")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Password"), "4Toast");
    expect(screen.getByText("Password strength: Strong")).toBeInTheDocument();
  });

  it("announces a refused sign-up", async () => {
    signUpMock.mockResolvedValue({ error: "That email address already has an account." });
    render(<RegisterForm />);

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("That email address already has an account.");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "That email address already has an account.",
    );
  });
});
