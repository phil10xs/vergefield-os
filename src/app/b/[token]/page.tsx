import Link from "next/link";
import type { Metadata } from "next";
import { Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";

// Public-repo placeholder. The real magic-link Issues & Bills Tracker Board lives only on
// the local internal-VergeSnag branch and is never pushed.

export const metadata: Metadata = { title: "Issues & Bills Tracker Board" };

export default async function PublicBoardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await params;
  return (
    <main className="mx-auto w-full max-w-xl px-[var(--app-gutter)] py-8">
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Link2Off
          className="mx-auto h-10 w-10 text-muted-foreground"
          aria-hidden
        />
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
          Board not in this build
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Magic-link Issues &amp; Bills Tracker Boards ship in the internal build only. Check in
          below to start a visit — no account needed.
        </p>
        <div className="mt-5">
          <Link href="/request">
            <Button variant="accent" className="w-full sm:w-auto">
              Start a check-in
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
