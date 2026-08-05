import type { Metadata } from "next";
import { NotesWidget } from "@/features/notes";

export const metadata: Metadata = {
  title: "Notes",
};

export default function NotesPage() {
  return (
    <div className="mx-auto max-w-xl p-8">
      <NotesWidget />
    </div>
  );
}
