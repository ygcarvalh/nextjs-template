import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chooseShowRequestId } from "@/features/preferences/server/preference-actions";
import { DeactivateAccount } from "@/features/settings/components/deactivate-account";
import { PasswordForm } from "@/features/settings/components/password-form";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { ReferenceToggle } from "@/features/settings/components/reference-toggle";
import { enUS } from "@/i18n/dictionaries/en-US";

const { report } = vi.hoisted(() => ({ report: vi.fn() }));

vi.mock("@/components/problem-toast", () => ({ useProblemToast: () => report }));
vi.mock("@/features/settings/server/settings-actions", () => ({
  deactivateAccount: vi.fn(),
}));
vi.mock("@/features/preferences/server/preference-actions", () => ({
  chooseShowRequestId: vi.fn().mockResolvedValue(undefined),
}));

function answer(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "x-request-id": "req-abc" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("location", { reload: vi.fn() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProfileForm", () => {
  it("sends both fields to the account endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(answer({ saved: true }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ProfileForm email="ada@example.com" name="Ada" />);

    await userEvent.clear(screen.getByLabelText(enUS.settings.name));
    await userEvent.type(screen.getByLabelText(enUS.settings.name), "Grace");
    await userEvent.click(screen.getByRole("button", { name: enUS.settings.save }));

    expect(await screen.findByRole("status")).toHaveTextContent(enUS.settings.saved);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/account");
    expect(JSON.parse(String(init.body))).toEqual({
      name: "Grace",
      email: "ada@example.com",
    });
  });

  it("sends a changed address too", async () => {
    const fetchMock = vi.fn().mockResolvedValue(answer({ saved: true }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ProfileForm email="ada@example.com" name="Ada" />);

    await userEvent.clear(screen.getByLabelText(enUS.settings.email));
    await userEvent.type(screen.getByLabelText(enUS.settings.email), "grace@example.com");
    await userEvent.click(screen.getByRole("button", { name: enUS.settings.save }));

    expect(await screen.findByRole("status")).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      name: "Ada",
      email: "grace@example.com",
    });
  });

  it("starts empty when the account has no name", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<ProfileForm email="ada@example.com" name={null} />);

    expect(screen.getByLabelText(enUS.settings.name)).toHaveValue("");
  });

  it("reports a refused save through the toast, keeping what was typed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(answer({ error: "taken" }, 409)));
    render(<ProfileForm email="ada@example.com" name="Ada" />);

    await userEvent.click(screen.getByRole("button", { name: enUS.settings.save }));

    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(report.mock.calls[0][0]).toMatchObject({ problem: { status: 409 } });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByLabelText(enUS.settings.name)).toHaveValue("Ada");
  });
});

describe("PasswordForm", () => {
  async function fillAndSubmit(values: { current: string; next: string; confirmation: string }) {
    await userEvent.type(screen.getByLabelText(enUS.settings.currentPassword), values.current);
    await userEvent.type(screen.getByLabelText(enUS.settings.newPassword), values.next);
    await userEvent.type(screen.getByLabelText(enUS.settings.confirmPassword), values.confirmation);
    await userEvent.click(screen.getByRole("button", { name: enUS.settings.changePassword }));
  }

  it("clears the fields once the change went through", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(answer({ changed: true })));
    render(<PasswordForm />);

    await fillAndSubmit({
      current: "old-password",
      next: "new-password",
      confirmation: "new-password",
    });

    expect(await screen.findByRole("status")).toHaveTextContent(enUS.settings.passwordChanged);
    expect(screen.getByLabelText(enUS.settings.currentPassword)).toHaveValue("");
  });

  it("refuses two new passwords that disagree without asking anyone", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<PasswordForm />);

    await fillAndSubmit({
      current: "old-password",
      next: "new-password",
      confirmation: "different-password",
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(enUS.settings.passwordMismatch);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(enUS.settings.currentPassword)).toHaveValue("old-password");
  });

  it("refuses a password shorter than the floor", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<PasswordForm />);

    await fillAndSubmit({ current: "old-password", next: "short", confirmation: "short" });

    expect(await screen.findByRole("alert")).toHaveTextContent("at least 8 characters");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a wrong current password through the toast", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(answer({ error: "Current password is incorrect" }, 403)),
    );
    render(<PasswordForm />);

    await fillAndSubmit({
      current: "not-the-one",
      next: "new-password",
      confirmation: "new-password",
    });

    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText(enUS.settings.currentPassword)).toHaveValue("not-the-one");
  });
});

describe("DeactivateAccount", () => {
  it("stays disabled until the address matches exactly", async () => {
    render(<DeactivateAccount email="ada@example.com" />);
    const button = screen.getByRole("button", { name: enUS.settings.deactivate });

    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/ada@example.com/), "ada@example.co");
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/ada@example.com/), "m");
    expect(button).toBeEnabled();
  });
});

describe("ReferenceToggle", () => {
  it("reflects the stored setting", () => {
    render(<ReferenceToggle enabled={false} />);

    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("stores the flipped value as soon as it is flipped", async () => {
    render(<ReferenceToggle enabled={false} />);

    await userEvent.click(screen.getByRole("switch"));

    expect(vi.mocked(chooseShowRequestId).mock.calls[0][0].get("showRequestId")).toBe("true");
    expect(screen.getByRole("switch")).toBeChecked();
  });
});

describe("settings forms accessibility", () => {
  it("has no detectable violations", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { container } = render(
      <main>
        <ProfileForm email="ada@example.com" name="Ada" />
        <PasswordForm />
        <ReferenceToggle enabled />
        <DeactivateAccount email="ada@example.com" />
      </main>,
    );

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
