import type { Dictionary } from "@/i18n/dictionaries/en-US";
import { enUS } from "@/i18n/dictionaries/en-US";
import { ptBR } from "@/i18n/dictionaries/pt-BR";
import type { Locale } from "@/i18n/locale";

const DICTIONARIES: Record<Locale, Dictionary> = {
  "en-US": enUS,
  "pt-BR": ptBR,
};

export function dictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
