"use client";

import * as React from "react";
import { CheckinProgress } from "@/components/request/checkin-progress";

export const CHECKIN_SUBMITTED_KEY = "vf-checkin-submitted";

/**
 * Check-in form shell. Latches the progress overlay on submit and holds it
 * until the report arrives — persisted in sessionStorage so even a remount
 * mid-analysis (dev reload, React remount) cannot drop the wait screen. The
 * report page clears the flag on arrival; the overlay's cancel clears it on
 * failure.
 */
export function CheckinForm({
  action,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(CHECKIN_SUBMITTED_KEY) === "1") {
        setSubmitted(true);
      }
    } catch {
      // Storage unavailable — fall back to in-memory latch.
    }
  }, []);

  function handleSubmit() {
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
      {submitted ? <CheckinProgress onCancel={handleCancel} /> : null}
    </form>
  );
}
