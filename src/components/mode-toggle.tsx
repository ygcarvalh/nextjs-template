"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Theme } from "@/features/preferences/types";
import { useThemeChoice } from "@/features/preferences/use-preference-choice";
import { useDictionary } from "@/i18n/provider";

export function ModeToggle() {
  const t = useDictionary();
  const choose = useThemeChoice();

  const themes: { value: Theme; label: string }[] = [
    { value: "light", label: t.chrome.themeLight },
    { value: "dark", label: t.chrome.themeDark },
    { value: "system", label: t.chrome.themeSystem },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" aria-label={t.chrome.toggleTheme} />}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ value, label }) => (
          <DropdownMenuItem key={value} onClick={() => choose(value)}>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
