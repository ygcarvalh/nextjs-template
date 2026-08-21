import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/toaster";
import { env } from "@/env";
import { PreferenceStore } from "@/features/preferences/components/preference-store";
import { readChromePreferences } from "@/features/preferences/server/preferences";
import { dictionaryFor } from "@/i18n/dictionary";
import { DictionaryProvider } from "@/i18n/provider";
import { getDictionary, getLocale } from "@/i18n/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "A Next.js starter with public and private route groups, a session backed by a real API, and a test suite that gates the build.";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "Next.js Template",
    template: "%s · Next.js Template",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "Next.js Template",
    title: "Next.js Template",
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next.js Template",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfdfe" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1116" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, t, chrome] = await Promise.all([
    getLocale(),
    getDictionary(),
    readChromePreferences(),
  ]);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DictionaryProvider dictionary={dictionaryFor(locale)} locale={locale}>
            <Toaster showReference={chrome.showRequestId}>
              <PreferenceStore locale={locale} theme={chrome.theme} />
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:font-medium focus:text-sm focus:ring-2 focus:ring-ring"
              >
                {t.chrome.skipToContent}
              </a>
              {children}
            </Toaster>
          </DictionaryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
