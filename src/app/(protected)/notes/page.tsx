import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesWidget } from "@/features/notes";
import { enabledFlags } from "@/features/preferences/server/features";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getDictionary()).titles.notes,
    robots: { index: false, follow: false },
  };
}

export default async function NotesPage() {
  if (!(await enabledFlags()).has("notes")) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <NotesWidget />
    </div>
  );
}
