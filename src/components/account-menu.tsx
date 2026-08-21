"use client";

import { CircleUserRound, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/features/auth/server/auth-actions";
import { chooseLocale, chooseTheme } from "@/features/preferences/server/preference-actions";
import type { Theme } from "@/features/preferences/types";
import { useLocaleChoice, useThemeChoice } from "@/features/preferences/use-preference-choice";
import { BrazilFlag, UnitedStatesFlag } from "@/i18n/components/flags";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/i18n/locale";
import { useDictionary } from "@/i18n/provider";

const FLAGS = { "en-US": UnitedStatesFlag, "pt-BR": BrazilFlag } as const;

export function AccountMenu({ locale }: { locale: Locale }) {
  const t = useDictionary();
  const chooseTheme = useThemeChoice();
  const chooseLanguage = useLocaleChoice();

  const themes: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: "light", label: t.chrome.themeLight, Icon: Sun },
    { value: "dark", label: t.chrome.themeDark, Icon: Moon },
    { value: "system", label: t.chrome.themeSystem, Icon: Monitor },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={t.chrome.account} />}
      >
        <CircleUserRound className="h-[1.2rem] w-[1.2rem]" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="running-head">{t.chrome.language}</DropdownMenuLabel>
          {LOCALES.map((option) => {
            const Flag = FLAGS[option];
            return (
              <DropdownMenuItem
                key={option}
                onClick={() => chooseLanguage(option)}
                aria-current={option === locale ? "true" : undefined}
                className="gap-2.5"
              >
                <Flag className="h-3.5 w-5 rounded-[1px] ring-1 ring-foreground/15" />
                {LOCALE_NAMES[option]}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="running-head">{t.chrome.theme}</DropdownMenuLabel>
          {themes.map(({ value, label, Icon }) => (
            <DropdownMenuItem key={value} onClick={() => chooseTheme(value)} className="gap-2.5">
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <form action={signOut}>
          <DropdownMenuItem
            render={<button type="submit" />}
            nativeButton
            className="w-full gap-2.5"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t.chrome.signOut}
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
