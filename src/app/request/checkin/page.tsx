import Link from "next/link";
import type { Metadata } from "next";
import { House } from "lucide-react";
import { createPublicRequestAction } from "@/app/actions/requests";
import { CapturePicker } from "@/components/capture/capture-picker";
import { NoteField } from "@/components/request/note-field";
import { SubmitCheckinButton } from "@/components/request/submit-checkin-button";
import { brand } from "@/brand";

export const metadata: Metadata = { title: "New check-in" };

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function CheckinPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-[var(--app-gutter)] py-8">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <House className="h-5 w-5" aria-hidden />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            {brand.name}
          </span>
        </div>
        <h1 className="font-display text-[length:var(--app-title-size)] font-bold tracking-tight">
          Your check-in
        </h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Leave your details, film what you see, and {brand.engine} builds
          your snag list and tracker board.
        </p>
      </div>

      <form
        action={createPublicRequestAction}
        className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Full name</span>
          <input
            name="requesterName"
            required
            autoComplete="name"
            placeholder="e.g. Jordan Lee"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">
            Property address
          </span>
          <input
            name="propertyAddress"
            required
            autoComplete="street-address"
            placeholder="e.g. 12 Rosebank Road, Manchester"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">
            Business name{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </span>
          <input
            name="businessName"
            autoComplete="organization"
            placeholder="e.g. Lee Property Care"
            className={inputClass}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">
              Phone or email
            </span>
            <input
              name="requesterContact"
              required
              autoComplete="tel"
              placeholder="How should the team reach you?"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">How urgent?</span>
            <select name="urgency" className={inputClass} defaultValue="normal">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        </div>
        <fieldset>
          <legend className="mb-1 px-1 text-sm font-semibold">
            Videos — film the issues
          </legend>
          <CapturePicker />
        </fieldset>
        <NoteField />
        <div>
          <SubmitCheckinButton />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {brand.engine} detects the trade and builds your report and
            tracker.
          </p>
        </div>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link
          href="/request"
          className="font-semibold text-link hover:underline"
        >
          ← Back to how it works
        </Link>
      </p>
    </main>
  );
}
