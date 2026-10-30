import type { ReactNode } from "react";
import Link from "next/link";
import { House } from "lucide-react";
import { brand } from "@/brand";
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
          <Link
            href="/request"
            className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <House className="h-4 w-4" aria-hidden />
            </span>
            <span className="truncate font-display text-base font-bold tracking-tight">
              {brand.name}
            </span>
          </Link>
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
