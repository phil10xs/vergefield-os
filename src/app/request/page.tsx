import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { createPublicRequestAction } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import { NarrationField } from "@/components/capture/narration-field";
import { MediaInputs } from "@/components/capture/media-inputs";
import { brand } from "@/brand";
import { TRADE_OPTIONS } from "@/lib/chat-parse";

export const metadata: Metadata = { title: "Request a repair" };

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function PublicRequestPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-[var(--app-gutter)] py-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Wrench className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {brand.name}
          </p>
          <h1 className="font-display text-[length:var(--app-title-size)] font-bold tracking-tight">
            Request a repair
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Owners and tenants: describe the issue, add photos or a video, and
            the trade team will review it. No account needed.
          </p>
        </div>
      </div>

      <form
        action={createPublicRequestAction}
        className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">I am a</span>
            <select name="requesterRole" className={inputClass} defaultValue="Property owner">
              <option>Property owner</option>
              <option>Tenant</option>
              <option>Agent</option>
            </select>
          </label>
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
        </div>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">
              Trade needed
            </span>
            <select name="trade" className={inputClass} defaultValue="Plumber">
              {TRADE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">How urgent?</span>
            <select name="urgency" className={inputClass} defaultValue="normal">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">
            Other trade{" "}
            <span className="font-normal text-muted-foreground">
              (only if trade is Other)
            </span>
          </span>
          <input
            name="otherTrade"
            placeholder="e.g. Steel fixer"
            className={inputClass}
          />
        </label>
        <div>
          <span className="mb-1 block text-sm font-semibold">
            Describe the issue
          </span>
          <NarrationField
            name="description"
            required
            placeholder="What is wrong, where, and since when? Type it or tap the mic and talk…"
          />
        </div>
        <div>
          <span className="mb-1 block text-sm font-semibold">
            Photos or video{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <MediaInputs />
        </div>
        <Button type="submit" variant="accent" className="w-full">
          Send request
        </Button>
      </form>
    </main>
  );
}
