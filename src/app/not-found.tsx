import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg py-8 text-center sm:py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          That link does not match a check-in, property, or board.
        </p>
        <Link href="/request" className="mt-6 inline-flex w-full justify-center sm:w-auto">
          <Button variant="accent" className="w-full sm:w-auto">
            Back to check-in
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}
