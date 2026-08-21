import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ptBR } from "@/i18n/dictionaries/pt-BR";
import { DictionaryProvider, useDictionary, useLocale } from "@/i18n/provider";

function Speaker() {
  const t = useDictionary();
  const locale = useLocale();
  return (
    <p>
      {t.chrome.settings} · {locale}
    </p>
  );
}

describe("DictionaryProvider", () => {
  it("hands its words down", () => {
    render(
      <DictionaryProvider dictionary={ptBR} locale="pt-BR">
        <Speaker />
      </DictionaryProvider>,
    );

    expect(screen.getByText("Ajustes · pt-BR")).toBeInTheDocument();
  });

  it("speaks the default outside the provider, so an error boundary still has words", () => {
    render(<Speaker />);

    expect(screen.getByText("Settings · en-US")).toBeInTheDocument();
  });
});
