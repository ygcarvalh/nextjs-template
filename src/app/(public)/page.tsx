import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const stack = [
  "Next.js App Router",
  "TypeScript",
  "Tailwind CSS v4",
  "shadcn/ui",
  "Biome",
  "Vitest + Testing Library",
  "next-themes",
  "Type-safe env (zod)",
];

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">Next.js Template</h1>
        <p className="text-muted-foreground">
          A scalable, feature-based starter. Edit this page in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">src/app/page.tsx</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What&apos;s inside</CardTitle>
          <CardDescription>Batteries included, ready to build on.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {stack.map((item) => (
              <li key={item} className="text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/notes" className={buttonVariants()}>
          Open the notes example
        </Link>
        <Link href="/api/health" className={buttonVariants({ variant: "outline" })}>
          Health check
        </Link>
      </div>
    </div>
  );
}
