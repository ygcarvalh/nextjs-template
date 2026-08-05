import type { MetadataRoute } from "next";
import { env } from "@/env";

// Only public, indexable routes belong here.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", env.NEXT_PUBLIC_APP_URL).toString(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
