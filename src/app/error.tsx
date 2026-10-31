"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg py-8 text-center sm:py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          This page could not be loaded. Try again, or go back to check-in.
        </p>
        <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
          <Button type="button" variant="accent" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/request" className="inline-flex">
            <Button type="button" variant="outline" className="w-full">
              Back to check-in
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
