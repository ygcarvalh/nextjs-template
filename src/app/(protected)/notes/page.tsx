import type { Metadata } from "next";
import { NotesWidget } from "@/features/notes";

export const metadata: Metadata = {
  title: "Notes",
  robots: { index: false, follow: false },
};

export default function NotesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <NotesWidget />
    </div>
  );
}
