"use client";

import * as React from "react";
import { Check, CheckCircle2, Loader2 } from "lucide-react";
import { brand } from "@/brand";

const STEPS = [
  "Uploading your videos",
  "Listening to what you filmed",
  "Detecting the trade",
  "Building your report, Issues snag list & Bills Tracker Board",
];

const STEP_MS = 2800;

/**
 * Full-screen staged progress for a check-in. Mounted by the submit button
 * while the server action runs, and by the report loading state during
 * navigation — so the wait screen never drops until the report paints.
 */
export function CheckinProgress({
  heading = "Check-in submitted",
  onCancel,
}: {
  heading?: string;
  onCancel?: () => void;
}) {
  const [step, setStep] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [slow, setSlow] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    }, STEP_MS);
    const clock = setInterval(() => {
      setElapsed((seconds) => seconds + 1);
    }, 1000);
    const slowTimer = setTimeout(() => setSlow(true), 60000);
    return () => {
      clearInterval(timer);
      clearInterval(clock);
      clearTimeout(slowTimer);
    };
  }, []);

  const stamped = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Submitting your check-in"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/95 px-[var(--app-gutter)] py-8 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card px-5 py-8 text-center sm:px-8">
        <CheckCircle2
          className="mx-auto h-12 w-12 text-[var(--gv-teal-bright)]"
          aria-hidden
        />
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {brand.engine} is building your Home/Property&apos;s Issues Snag
          list &amp; Bills Tracker.
        </p>
        <ol className="mt-6 space-y-3 text-left">
          {STEPS.map((label, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <li key={label} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? "bg-[var(--gv-teal-bright)] text-black"
                      : active
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-secondary/60 text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : active ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <span className="text-[11px] font-bold">{index + 1}</span>
                  )}
                </span>
                <span
                  className={
                    done || active ? "font-semibold" : "text-muted-foreground"
                  }
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="mt-6" aria-hidden>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-2/5 animate-progress-slide rounded-full bg-[var(--gv-teal-bright)]" />
          </div>
          <p className="mt-2 text-xs tabular-nums text-muted-foreground">
            {stamped} elapsed — still working
          </p>
        </div>
        {slow && onCancel ? (
          <div className="mt-6">
            <p className="text-xs text-muted-foreground">
              Taking longer than usual — big videos can take a few minutes.
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="mt-2 text-sm font-semibold text-link hover:underline"
            >
              Back to check-in
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
