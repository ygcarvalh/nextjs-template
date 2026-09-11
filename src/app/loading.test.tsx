import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Loading from "@/app/loading";
import { ptBR } from "@/i18n/dictionaries/pt-BR";

vi.mock("@/i18n/server", async () => {
  const { ptBR } = await import("@/i18n/dictionaries/pt-BR");
  return { getDictionary: vi.fn().mockResolvedValue(ptBR) };
});

describe("Loading", () => {
  it("announces itself in the reader's language", async () => {
    render(await Loading());

    expect(screen.getByRole("status")).toHaveTextContent(ptBR.chrome.loading);
  });
});
