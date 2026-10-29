import type { Metadata, Viewport } from "next";
import { Sora, Syne } from "next/font/google";
import { brand } from "@/brand";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Sora({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "http://localhost:3002",
  ),
  title: {
    default: brand.name,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#071011" },
    { media: "(prefers-color-scheme: light)", color: "#f7faf9" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="vergefield-theme"
          disableTransitionOnChange
        >
          {children}
          <footer className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] pb-8">
            <p className="border-t border-border pt-4 text-xs text-muted-foreground">
              VergeField OS ·{" "}
              <a
                href="https://github.com/phil10xs/vergefield-os/blob/main/LICENSE"
                className="font-semibold text-link hover:underline"
              >
                Source-available (BSL)
              </a>{" "}
              ·{" "}
              <a
                href="https://github.com/phil10xs/vergefield-os"
                className="font-semibold text-link hover:underline"
              >
                github.com/phil10xs/vergefield-os
              </a>
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
