import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { VerificationLedger } from "@/features/verification/components/verification-ledger";
import { verificationGates } from "@/features/verification/gates";
import { enUS } from "@/i18n/dictionaries/en-US";

describe("VerificationLedger", () => {
  it("names the region it labels", () => {
    render(<VerificationLedger t={enUS} />);

    expect(screen.getByRole("region", { name: enUS.verification.heading })).toBeInTheDocument();
  });

  it("renders every gate with its value and command", () => {
    render(<VerificationLedger t={enUS} />);
    const region = within(screen.getByRole("region", { name: enUS.verification.heading }));

    for (const gate of verificationGates) {
      expect(region.getByText(enUS.verification[gate.labelKey])).toBeInTheDocument();
      expect(region.getByText(gate.command)).toBeInTheDocument();
    }
  });

  it("pairs each label with a value and a command as a description list", () => {
    const { container } = render(<VerificationLedger t={enUS} />);

    expect(container.querySelectorAll("dt")).toHaveLength(verificationGates.length);
    expect(container.querySelectorAll("dd")).toHaveLength(verificationGates.length * 2);
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(<VerificationLedger t={enUS} />);

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
