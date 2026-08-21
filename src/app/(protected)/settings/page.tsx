import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { env } from "@/env";
import { getSession } from "@/features/auth/server";
import {
  apiFeatures,
  enabledFlags,
  followsEnvironment,
} from "@/features/preferences/server/features";
import { readPreferences } from "@/features/preferences/server/preferences";
import { DEFAULT_PREFERENCES } from "@/features/preferences/types";
import { DeactivateAccount } from "@/features/settings/components/deactivate-account";
import { FeatureToggles } from "@/features/settings/components/feature-toggles";
import { PasswordForm } from "@/features/settings/components/password-form";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { ReferenceToggle } from "@/features/settings/components/reference-toggle";
import { LanguageToggle } from "@/i18n/components/language-toggle";
import { getDictionary, getLocale } from "@/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getDictionary()).titles.settings,
    robots: { index: false, follow: false },
  };
}

export default async function SettingsPage() {
  const [session, t, locale, preferences, flags, following, served] = await Promise.all([
    getSession(),
    getDictionary(),
    getLocale(),
    readPreferences(),
    enabledFlags(),
    followsEnvironment(),
    apiFeatures(),
  ]);

  if (!session) {
    notFound();
  }

  const showReference = preferences?.showRequestId ?? DEFAULT_PREFERENCES.showRequestId;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="running-head">{t.settings.eyebrow}</p>
      <h1 className="mt-3 font-semibold text-3xl tracking-[-0.03em]">{t.settings.title}</h1>

      <section className="mt-12 border-t pt-8">
        <h2 className="running-head">{t.settings.appearanceHead}</h2>
        <p className="mt-3 max-w-[58ch] text-muted-foreground text-sm leading-relaxed">
          {t.settings.appearanceLede}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <ModeToggle />
          <LanguageToggle current={locale} />
        </div>
      </section>

      <section className="mt-14 border-t pt-8">
        <h2 className="running-head">{t.settings.profileHead}</h2>
        <p className="mt-3 max-w-[58ch] text-muted-foreground text-sm leading-relaxed">
          {t.settings.profileLede}
        </p>
        <div className="mt-5">
          <ProfileForm email={session.email} name={session.name} />
        </div>
      </section>

      <section className="mt-14 border-t pt-8">
        <h2 className="running-head">{t.settings.securityHead}</h2>
        <p className="mt-3 max-w-[58ch] text-muted-foreground text-sm leading-relaxed">
          {t.settings.securityLede}
        </p>
        <div className="mt-5">
          <PasswordForm />
        </div>
      </section>

      <section className="mt-14 border-t pt-8">
        <h2 className="running-head">{t.settings.observabilityHead}</h2>
        <p className="mt-3 max-w-[58ch] text-muted-foreground text-sm leading-relaxed">
          {t.settings.observabilityLede}
        </p>
        <dl className="mt-5 border-t">
          <div className="flex items-baseline justify-between gap-4 border-b py-3">
            <dt className="text-sm">{t.settings.serviceName}</dt>
            <dd className="font-mono text-muted-foreground text-sm">{env.SERVICE_NAME}</dd>
          </div>
        </dl>
        <div className="mt-5">
          <ReferenceToggle enabled={showReference} />
        </div>
        {served.has("request-log") ? (
          <div className="mt-5">
            <Link
              href="/requests"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {t.settings.openRequests}
            </Link>
          </div>
        ) : (
          <p className="mt-5 text-muted-foreground text-sm">{t.settings.requestsWithheld}</p>
        )}
      </section>

      <section className="mt-14 border-t pt-8">
        <h2 className="running-head">{t.settings.flagsHead}</h2>
        <p className="mt-3 max-w-[58ch] text-muted-foreground text-sm leading-relaxed">
          {t.settings.flagsLede}
        </p>
        <div className="mt-5">
          <FeatureToggles enabled={[...flags]} following={following} />
        </div>
      </section>

      <section className="mt-14 border-t pt-8">
        <h2 className="running-head">{t.settings.dangerHead}</h2>
        <p className="mt-3 max-w-[58ch] text-muted-foreground text-sm leading-relaxed">
          {t.settings.dangerLede}
        </p>
        <div className="mt-5">
          <DeactivateAccount email={session.email} />
        </div>
      </section>
    </div>
  );
}
