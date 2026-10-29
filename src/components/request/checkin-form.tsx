"use client";

import * as React from "react";
import { CheckinProgress } from "@/components/request/checkin-progress";

export const CHECKIN_SUBMITTED_KEY = "vf-checkin-submitted";

/**
 * Check-in form shell. Requires a note or at least one video before
 * submitting, then latches the progress overlay until the report arrives —
 * persisted in sessionStorage so even a remount mid-analysis (dev reload,
 * React remount) cannot drop the wait screen. The report page clears the
 * flag on arrival; the overlay's cancel clears it on failure.
 */
export function CheckinForm({
  action,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(CHECKIN_SUBMITTED_KEY) === "1") {
        setSubmitted(true);
      }
    } catch {
      // Storage unavailable — fall back to in-memory latch.
    }
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const note = new FormData(form).get("note");
    const hasNote = typeof note === "string" && note.trim().length > 0;
    const hasFile = [...form.querySelectorAll('input[name="media"]')].some(
      (input) => (input as HTMLInputElement).files?.length,
    );
    if (!hasNote && !hasFile) {
      event.preventDefault();
      setError("Describe the issue or attach a video to continue.");
      return;
    }
    setError(null);
    try {
      sessionStorage.setItem(CHECKIN_SUBMITTED_KEY, "1");
    } catch {
      // Ignore — in-memory latch still holds for the session.
    }
    setSubmitted(true);
  }

  function handleCancel() {
    try {
      sessionStorage.removeItem(CHECKIN_SUBMITTED_KEY);
    } catch {
      // Ignore.
    }
    setSubmitted(false);
  }

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      {children}
      {error && !submitted ? (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
      {submitted ? <CheckinProgress onCancel={handleCancel} /> : null}
    </form>
  );
}
