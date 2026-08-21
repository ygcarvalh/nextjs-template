"use client";

import { createContext, type ReactNode, useContext } from "react";
import { enUS } from "@/i18n/dictionaries/en-US";
import type { Dictionary } from "@/i18n/dictionary";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locale";

type Spoken = { dictionary: Dictionary; locale: Locale };

// The default is the real dictionary, so an error boundary rendering outside
// the provider still has words.
const SpokenContext = createContext<Spoken>({ dictionary: enUS, locale: DEFAULT_LOCALE });

export function DictionaryProvider({
  dictionary,
  locale,
  children,
}: Spoken & { children: ReactNode }) {
  return <SpokenContext value={{ dictionary, locale }}>{children}</SpokenContext>;
}

export function useDictionary(): Dictionary {
  return useContext(SpokenContext).dictionary;
}

export function useLocale(): Locale {
  return useContext(SpokenContext).locale;
}
