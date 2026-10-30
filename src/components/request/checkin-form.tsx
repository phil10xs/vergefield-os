"use client";

import * as React from "react";
import { CheckinProgress } from "@/components/request/checkin-progress";

export const CHECKIN_SUBMITTED_KEY = "vf-checkin-submitted";

/**
 * Check-in form shell. A video is enough to submit. Latches the progress
 * overlay until the report arrives —
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
    const hasFile = [...form.querySelectorAll('input[name="media"]')].some(
      (input) => (input as HTMLInputElement).files?.length,
    );
    if (!hasFile) {
      event.preventDefault();
      setError("Attach a video to continue.");
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
      className="@container space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6"
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
