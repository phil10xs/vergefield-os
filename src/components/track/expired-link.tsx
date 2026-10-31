import Link from "next/link";
import { Link2Off } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export function ExpiredBoardLink() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card px-5 py-10 text-center sm:px-8 sm:py-14">
        <Link2Off
          className="mx-auto h-10 w-10 text-muted-foreground"
          aria-hidden
        />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          This link has expired
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Property links last 7 days and do not use a password. Ask for a fresh
          one from your visit report.
        </p>
        <div className="mt-6">
          <Link href="/request" className="inline-flex w-full justify-center sm:w-auto">
            <Button variant="accent" className="w-full sm:w-auto">
              Start a check-in
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
