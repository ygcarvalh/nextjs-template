import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chooseFeatures } from "@/features/preferences/server/preference-actions";
import { FeatureToggles } from "@/features/settings/components/feature-toggles";
import { enUS } from "@/i18n/dictionaries/en-US";
import { FLAGS } from "@/lib/flags";

vi.mock("@/features/preferences/server/preference-actions", () => ({
  chooseFeatures: vi.fn().mockResolvedValue(undefined),
}));

function sent(call = 0): string | null {
  const form = vi.mocked(chooseFeatures).mock.calls[call][0];
  const value = form.get("features");
  return typeof value === "string" ? value : null;
}

describe("FeatureToggles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers one switch per optional feature", () => {
    render(<FeatureToggles enabled={[]} following />);

    expect(screen.getAllByRole("switch")).toHaveLength(FLAGS.length);
  });

  it("shows which features are on", () => {
    render(<FeatureToggles enabled={["notes"]} following />);

    expect(screen.getByRole("switch", { name: "notes" })).toBeChecked();
  });

  it("names the list when a feature is turned on", async () => {
    render(<FeatureToggles enabled={[]} following />);

    await userEvent.click(screen.getByRole("switch", { name: "notes" }));

    expect(sent()).toBe("notes");
  });

  it("names an empty list when the last feature is turned off", async () => {
    render(<FeatureToggles enabled={["notes"]} following />);

    await userEvent.click(screen.getByRole("switch", { name: "notes" }));

    expect(sent()).toBe("");
  });

  it("says whose list is in force", () => {
    render(<FeatureToggles enabled={["notes"]} following />);

    expect(screen.getByText(enUS.settings.flagsFollowing)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: enUS.settings.flagsUseEnvironment }),
    ).not.toBeInTheDocument();
  });

  it("offers a way back to the environment once the account has its own list", async () => {
    render(<FeatureToggles enabled={["notes"]} following={false} />);

    expect(screen.getByText(enUS.settings.flagsOverridden)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: enUS.settings.flagsUseEnvironment }));

    expect(sent()).toBeNull();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <main>
        <FeatureToggles enabled={["notes"]} following={false} />
      </main>,
    );

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
