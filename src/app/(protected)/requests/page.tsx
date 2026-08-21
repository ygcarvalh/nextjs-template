import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/features/auth/server";
import { RequestsEmpty } from "@/features/requests/components/requests-empty";
import { RequestsFilters } from "@/features/requests/components/requests-filters";
import { RequestsPager } from "@/features/requests/components/requests-pager";
import { RequestsTable } from "@/features/requests/components/requests-table";
import { parseRequestFilters } from "@/features/requests/filters";
import { listRequests } from "@/features/requests/server/requests";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getDictionary()).titles.requests,
    robots: { index: false, follow: false },
  };
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, t, locale, params] = await Promise.all([
    getSession(),
    getDictionary(),
    getLocale(),
    searchParams,
  ]);

  if (!session) {
    notFound();
  }

  const filters = parseRequestFilters(params);
  const page = await listRequests(filters);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="running-head">{t.requests.eyebrow}</p>
      <h1 className="mt-3 font-semibold text-3xl tracking-[-0.03em]">{t.requests.title}</h1>
      <p className="mt-4 max-w-[64ch] text-muted-foreground leading-relaxed">{t.requests.lede}</p>
      <p className="mt-2 text-muted-foreground text-sm">
        {session.role === "admin" ? t.requests.scopeAdmin : t.requests.scopeSelf}
      </p>

      <RequestsFilters filters={filters} t={t} />

      {page === null ? (
        <p role="alert" className="mt-8 text-destructive text-sm">
          {t.requests.unavailable}
        </p>
      ) : page.items.length === 0 ? (
        <RequestsEmpty t={t} />
      ) : (
        <>
          <RequestsTable entries={page.items} t={t} locale={locale} />
          <RequestsPager page={page} filters={filters} t={t} />
        </>
      )}
    </div>
  );
}
