import "server-only";
import { cookies, headers } from "next/headers";
import { type Dictionary, dictionaryFor } from "@/i18n/dictionary";
import { type Locale, negotiateLocale } from "@/i18n/locale";
import { LOCALE_COOKIE } from "@/lib/cookies";

export async function getLocale(): Promise<Locale> {
  const [jar, incoming] = await Promise.all([cookies(), headers()]);
  return negotiateLocale(jar.get(LOCALE_COOKIE)?.value ?? null, incoming.get("accept-language"));
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaryFor(await getLocale());
}
