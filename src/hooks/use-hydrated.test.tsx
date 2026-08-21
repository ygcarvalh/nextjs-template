import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useHydrated } from "@/hooks/use-hydrated";

function Probe() {
  return <span>{useHydrated() ? "hydrated" : "waiting"}</span>;
}

describe("useHydrated", () => {
  it("answers true once the effect has run", () => {
    render(<Probe />);

    expect(screen.getByText("hydrated")).toBeInTheDocument();
  });
});
