"use client";

import * as React from "react";
import Link from "next/link";
import { requestBoardLinkAction } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import { ErrorText } from "@/components/layout/page-header";

export function BoardLinkRequest({ jobId }: { jobId: string }) {
  const [email, setEmail] = React.useState("");
  const [result, setResult] = React.useState<{
    url: string;
    emailed: boolean;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const link = await requestBoardLinkAction(jobId, email);
      setResult(link);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create the link",
      );
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border border-border bg-background p-3">
        <p className="text-sm font-semibold">Your private board link is ready</p>
        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
          {result.url}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {result.emailed
            ? "Sent to your email — it expires in 7 days."
            : "Demo mode: email sending is off, so the link is shown here instead of emailed. It expires in 7 days."}
        </p>
        <Link href={result.url} className="mt-3 inline-block">
          <Button variant="accent" size="sm">
            Open my board
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        aria-label="Email for your board link"
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button
        type="submit"
        variant="accent"
        disabled={busy}
        className="w-full sm:w-auto"
      >
        {busy ? "Sending…" : "Email me the board"}
      </Button>
      {error ? (
        <div className="sm:col-span-2 sm:w-full">
          <ErrorText>{error}</ErrorText>
        </div>
      ) : null}
    </form>
  );
}
