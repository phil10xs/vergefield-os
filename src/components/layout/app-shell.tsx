import type { ReactNode } from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { Button } from "@/components/ui/button";

export function AppShell({
  children,
  showCheckIn = true,
}: {
  children: ReactNode;
  showCheckIn?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="shell flex h-14 items-center justify-between gap-3 sm:h-16">
          <BrandWordmark />
          {showCheckIn ? (
            <Link href="/request/checkin" className="shrink-0">
              <Button variant="accent">Check in</Button>
            </Link>
          ) : (
            <Link
              href="/request"
              className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-link hover:underline"
            >
              How it works
            </Link>
          )}
        </div>
      </header>
      <main className="shell flex-1 py-6 sm:py-8">{children}</main>
    </div>
  );
}
