import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicJob } from "@/server/reporting";

export const metadata: Metadata = { title: "Request received" };

export default async function RequestThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;
  const jobRow = jobId ? await getPublicJob(jobId) : undefined;
  if (!jobRow) notFound();
  const reference = jobRow.id.slice(0, 8).toUpperCase();

  return (
    <main className="mx-auto w-full max-w-xl px-[var(--app-gutter)] py-8">
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <CheckCircle2
          className="mx-auto h-10 w-10 text-[var(--gv-teal-bright)]"
          aria-hidden
        />
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
          Request received
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          The trade team will review it and be in touch
          {jobRow.requesterContact ? ` on ${jobRow.requesterContact}` : ""}.
          Your reference is:
        </p>
        <p className="mx-auto mt-3 inline-block rounded-xl bg-primary px-4 py-2 font-mono text-lg font-bold tracking-widest text-primary-foreground">
          {reference}
        </p>
        <div className="mt-5">
          <Link href={`/request/${jobRow.id}`}>
            <Button variant="accent" className="w-full sm:w-auto">
              Track your request
            </Button>
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Bookmark the tracking link — it is your private receipt for this
          request.
        </p>
      </div>
    </main>
  );
}
