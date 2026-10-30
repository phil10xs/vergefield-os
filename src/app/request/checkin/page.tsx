import type { Metadata } from "next";
import { createPublicRequestAction } from "@/app/actions/requests";
import { brand, howItWorks } from "@/brand";
import { CapturePicker } from "@/components/capture/capture-picker";
import { AppShell } from "@/components/layout/app-shell";
import { CheckinForm } from "@/components/request/checkin-form";
import { SubmitCheckinButton } from "@/components/request/submit-checkin-button";

export const metadata: Metadata = { title: "New check-in" };

export default function CheckinPage() {
  return (
    <AppShell showCheckIn={false}>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-12 xl:gap-16">
        <div className="min-w-0 max-w-prose">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Your check-in
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Film what you see, and {brand.engine} builds your Issues snag list
            and your property&apos;s Bills Tracker.
          </p>
          <ol className="mt-6 space-y-3">
            {howItWorks.map((step, index) => (
              <li key={step.title} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed">
                  <span className="font-semibold">{step.title}. </span>
                  <span className="text-muted-foreground">{step.body}</span>
                </p>
              </li>
            ))}
          </ol>
        </div>

        <CheckinForm action={createPublicRequestAction}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Property address
            </span>
            <input
              name="propertyAddress"
              required
              autoComplete="street-address"
              placeholder="e.g. 12 Rosebank Road, Manchester"
              className="text-field"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              What trade do you need?
            </span>
            <select
              name="trade"
              className="text-field"
              defaultValue="auto"
              disabled
            >
              <option value="auto">Auto-detect from my videos</option>
            </select>
            <span className="mt-1.5 block text-sm text-muted-foreground">
              Manual trade picker coming soon — auto-detect is on for now.
            </span>
          </label>
          <fieldset>
            <legend className="mb-1.5 block text-sm font-semibold leading-relaxed">
              Do a video clip for each issue. Narrate as you film
            </legend>
            <CapturePicker />
          </fieldset>
          <div>
            <SubmitCheckinButton />
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {brand.engine} detects the trade and builds your report and
              tracker.
            </p>
          </div>
        </CheckinForm>
      </div>
    </AppShell>
  );
}
