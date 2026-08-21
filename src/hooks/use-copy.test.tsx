import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCopy } from "@/hooks/use-copy";

function Copier({ value }: { value: string }) {
  const { copied, copy } = useCopy();
  return (
    <button type="button" onClick={() => void copy(value)}>
      {copied ? "copied" : "copy"}
    </button>
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useCopy", () => {
  it("writes to the clipboard and reports it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<Copier value="abc-123" />);
    await userEvent.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("abc-123");
    expect(screen.getByRole("button")).toHaveTextContent("copied");
  });

  it("stops reporting after a couple of seconds", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<Copier value="abc-123" />);
    await userEvent.click(screen.getByRole("button"), { advanceTimers: vi.advanceTimersByTime });
    expect(screen.getByRole("button")).toHaveTextContent("copied");

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    expect(screen.getByRole("button")).toHaveTextContent("copy");
  });

  it("says nothing happened when the clipboard is unavailable", async () => {
    vi.stubGlobal("navigator", {});

    render(<Copier value="abc-123" />);
    await userEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("copy");
  });

  it("says nothing happened when the browser refuses", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    render(<Copier value="abc-123" />);
    await userEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("copy");
  });
});
