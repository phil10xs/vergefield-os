import Link from "next/link";
import type { Metadata } from "next";
import { BadgePercent, House, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/brand";

export const metadata: Metadata = { title: "Check in your property" };

const TESTIMONIALS = [
  {
    quote:
      "Filmed the damp on Tuesday, plumber booked by Friday — and every visit stays on the board.",
    name: "Amara O., landlord, Manchester",
  },
  {
    quote:
      "Snag rounds used to die in WhatsApp. Now each flat has a memory.",
    name: "Tom W., facility manager",
  },
  {
    quote:
      "No account, no app. Just a link where I watch my repair move to done.",
    name: "Priya S., tenant",
  },
];

const HOW_IT_WORKS = [
  {
    title: "Check in your property",
    body: "walk through and film the issues you see in 20-second clips.",
  },
  {
    title: "Get your Issues Issues snag list",
    body: "VergeSnag AI analyses your clips and lists every issue with its trade.",
  },
  {
    title: "Track on your Issues & Bill Tracker board",
    body: "follow each issue till it's fixed — bills matched on use.",
  },
];

export default function PublicRequestPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-[var(--app-gutter)] py-8">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <House className="h-5 w-5" aria-hidden />
            <Wrench
              className="absolute -bottom-1 -right-1 h-4.5 w-4.5 rounded-full bg-[var(--gv-signal)] p-0.5 text-black"
              aria-hidden
            />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            {brand.name}
          </span>
        </div>
        <h1 className="font-display text-[length:var(--app-title-size)] font-bold tracking-tight">
          Landlords, Home Owners &amp; Tenants - Check in your property{" "}
          <span className="text-[var(--gv-teal-bright)]">for free</span> this
          festive season.{" "}
          <span className="block">See &amp; track your home fix bills.</span>
        </h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          We are matching your home fixing bills this festive period.
          Let&apos;s get your homes and properties fixed &amp; ready for
          visits — here&apos;s how it works:
        </p>
        <ol className="mt-3 max-w-md space-y-2.5">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <p className="text-sm">
                <span className="font-semibold">{step.title} — </span>
                <span className="text-muted-foreground">{step.body}</span>
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Powered by {brand.engine}.
        </p>
      </div>

      <div className="mb-8 flex items-start gap-3 rounded-2xl bg-[var(--gv-signal)] p-4 text-black">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/10">
          <BadgePercent className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-display text-base font-bold tracking-tight">
            Festive offer
          </p>
          <p className="mt-0.5 text-sm font-medium leading-snug">
            GoVerge is giving discounts on home fixes and repairs checked in
            with {brand.shortName}.
          </p>
        </div>
      </div>

      <section aria-label="Before and after VergeSnag" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/checkin-before.jpg"
              alt="Neglected UK house with mould, bad sink and broken window close-ups"
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-destructive">
                Before
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Issues spotted too late, scattered across chats.
              </p>
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-2xl border border-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/checkin-after.jpg"
              alt="Cared-for UK house with fixed wall, sink and window close-ups"
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--gv-teal-bright)]">
                After
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Checked in, tracked and fixed with {brand.name}.
              </p>
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        aria-label={`Start using ${brand.name}`}
        className="mb-8 rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6"
      >
        <h2 className="font-display text-xl font-bold tracking-tight">
          Your property, remembered.
        </h2>
        <p className="mt-1 text-sm opacity-90">
          Film a 20-second check-in and {brand.engine} builds your Issues snag list
          and Issues &amp; Bill Tracker board for your home/property fixes. Free to try, no
          account needed.
        </p>
        <Link href="/request/checkin" className="mt-4 inline-block">
          <Button variant="accent" className="w-full sm:w-auto">
            Start your check-in
          </Button>
        </Link>
      </section>

      <section aria-label="What owners say" className="mb-8">
        <h2 className="mb-2 font-display text-lg font-bold tracking-tight">
          What owners say
        </h2>
        <div className="divide-y divide-border">
          {TESTIMONIALS.map((item) => (
            <figure key={item.name} className="py-3">
              <blockquote className="text-sm leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-1 text-xs font-semibold text-muted-foreground">
                — {item.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
