import Link from "next/link";
import type { Metadata } from "next";
import { brand, howItWorks } from "@/brand";
import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { BoardPreview } from "@/components/request/board-preview";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: brand.name },
  description: brand.description,
};

const AUDIENCE = [
  "Landlords",
  "Homeowners",
  "Property/Facility Managers",
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Filmed the damp on Tuesday, plumber booked by Friday — and every visit stays on the board.",
    name: "Amara O.",
    role: "Landlord, Manchester",
  },
  {
    quote: "Snag rounds used to die in WhatsApp. Now each flat has a memory.",
    name: "Tom W.",
    role: "Facility manager",
  },
  {
    quote:
      "No account, no app. Just a link where I watch my repair move to done.",
    name: "Priya S.",
    role: "Tenant",
  },
];

const frame = "mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-6";

function MetaMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-foreground"
    >
      <path
        fill="currentColor"
        d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
      />
    </svg>
  );
}

export default function PublicRequestPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className={`${frame} flex h-16 items-center justify-between gap-3`}>
          <BrandWordmark />
          <Link href="/request/checkin" className="shrink-0">
            <Button variant="accent">Check in</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-3 pt-3 sm:px-5 sm:pt-5 lg:px-6 lg:pt-6">
          <div className="relative isolate mx-auto grid w-full max-w-7xl overflow-hidden rounded-[1.75rem] bg-[#071617] text-[#f7faf9] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            {/* Keeps the photo's 3:2 frame on wider screens without capping the copy. */}
            <div
              aria-hidden
              className="col-start-1 row-start-1 hidden w-full self-start aspect-[3/2] sm:block"
            />
            <figure className="col-start-1 row-start-2 mt-2 h-80 w-full sm:absolute sm:inset-0 sm:row-start-1 sm:mt-0 sm:h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/checkin-after.jpg"
                alt="Cared-for house with fixed wall, tap and window"
                className="h-full w-full object-cover object-center sm:object-[right_center]"
              />
              <figcaption className="sr-only">
                The cared-for house, with the fixed wall, tap and window shown beside it
              </figcaption>
            </figure>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(100deg,rgba(7,22,23,0.9)_0%,rgba(7,22,23,0.78)_26%,rgba(7,22,23,0.42)_44%,rgba(7,22,23,0.08)_58%,transparent_68%)] sm:block"
            />

            <div className="relative z-10 col-start-1 row-start-1 w-full min-w-0 self-center px-5 py-8 sm:w-[64%] sm:px-10 sm:py-10 md:w-[56%] lg:w-[50%] lg:px-14">
              <div className="min-w-0">
              <h1 className="max-w-3xl text-balance font-display text-[1.85rem] font-semibold leading-[1.08] tracking-[-0.045em] text-white md:text-[2.35rem] lg:text-[3rem] lg:leading-[1.06] xl:text-[3.4rem]">
                The AI Caretaker for your property.
              </h1>
              <p className="mt-4 max-w-2xl font-display text-lg font-bold leading-snug tracking-[-0.03em] text-white sm:text-xl lg:text-[1.65rem]">
                Film &amp; narrate the issue. Track the bill. All from one
                check-in.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                Damp walls, leaky pipes, weedy gardens — across one home or a
                whole portfolio.
              </p>
              <Link
                href="/request/checkin"
                className="mt-6 flex w-full sm:inline-flex sm:w-auto"
              >
                <Button
                  variant="accent"
                  size="lg"
                  className="h-14 w-full px-8 text-lg sm:w-auto"
                >
                  Start your check-in
                </Button>
              </Link>
              <ul
                className="mt-8 flex flex-wrap gap-2"
                aria-label="Who VergeCare is for"
              >
                {AUDIENCE.map((label) => (
                  <li key={label}>
                    <span className="inline-flex border border-white/25 px-3 py-2 text-xs font-semibold tracking-[0.04em] text-white/90">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-4 flex w-full max-w-7xl items-center gap-2 text-sm font-medium text-muted-foreground sm:mt-5">
            <MetaMark />
            Powered by Meta
          </p>
        </section>

        <section
          aria-label="How it works"
          className={`${frame} py-12 sm:py-16`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gv-teal-bright)]">
            How it works
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            From a short clip to a board you can follow
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Your caretaker watches every clip and builds the board.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-[#071617]">
            <iframe
              className="aspect-video w-full"
              src="https://www.youtube-nocookie.com/embed/aHLs56BK9LY"
              title="How VergeCare works"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <BoardPreview />
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <li key={step.title} className="min-w-0">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
                {index === 0 ? (
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    Film &amp; narrate what you see, and {brand.engine} builds
                    your Issues snag list and your property&apos;s Bills
                    Tracker.
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-label="Before and after VergeCare"
          className={`${frame} pb-12 sm:pb-16`}
        >
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Before and after
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/checkin-before.jpg"
                alt="Neglected UK house with mould, bad sink and broken window close-ups"
                className="aspect-[3/2] w-full object-cover"
              />
              <figcaption className="px-4 py-4 sm:px-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-destructive">
                  Before
                </p>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  Issues spotted too late, scattered across chats.
                </p>
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/checkin-after.jpg"
                alt="Cared-for UK house with fixed wall, sink and window close-ups"
                className="aspect-[3/2] w-full object-cover"
              />
              <figcaption className="px-4 py-4 sm:px-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--gv-teal-bright)]">
                  After
                </p>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  Checked in, tracked and fixed with {brand.shortName}.
                </p>
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          aria-label="What VergeCare looks after"
          className={`${frame} pb-12 sm:pb-16`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gv-teal-bright)]">
            What VergeCare looks after
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Issues and bills today. Rent, docs, and chats coming soon.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--gv-teal-bright)]">
                Live now
              </p>
              <ul className="mt-3 space-y-3 text-base leading-relaxed">
                <li>
                  <span className="font-semibold">Issues. </span>
                  <span className="text-muted-foreground">
                    Film a clip, get a costed snag list, track every fix to
                    done.
                  </span>
                </li>
                <li>
                  <span className="font-semibold">Bills. </span>
                  <span className="text-muted-foreground">
                    Every bill tracked until it&apos;s paid.
                  </span>
                </li>
                <li>
                  <span className="font-semibold">Clips kept. </span>
                  <span className="text-muted-foreground">
                    Every video you upload stays with the property. Giving her
                    a memory.
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Coming soon
              </p>
              <ul className="mt-3 space-y-3 text-base leading-relaxed">
                <li>
                  <span className="font-semibold">Rent. </span>
                  <span className="text-muted-foreground">
                    Rent due, paid, and chased — on the same board.
                  </span>
                </li>
                <li>
                  <span className="font-semibold">Docs. </span>
                  <span className="text-muted-foreground">
                    Certificates, contracts, and inventories — upload and keep
                    them with the property.
                  </span>
                </li>
                <li>
                  <span className="font-semibold">Chats. </span>
                  <span className="text-muted-foreground">
                    Owner, tenant, and tradesman talking around the fix — not
                    lost threads.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section
          aria-label="Why VergeCare"
          className={`${frame} pb-12 sm:pb-16`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gv-teal-bright)]">
            Why VergeCare
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Perfect for care across multiple homes and portfolios.
          </h2>
          <ul className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed sm:text-lg">
            <li>
              <span className="font-semibold">
                One check-in. Every issue looked after.{" "}
              </span>
              <span className="text-muted-foreground">
                Film &amp; narrate every issue in a single visit; your
                caretaker lists each one with its trade and likely cost.
              </span>
            </li>
            <li>
              <span className="font-semibold">
                Follow every bill to paid.{" "}
              </span>
              <span className="text-muted-foreground">
                Update the price on the board and watch each fix move to done.
              </span>
            </li>
            <li>
              <span className="font-semibold">
                Bidding and clips-to-pay are next.{" "}
              </span>
              <span className="text-muted-foreground">
                Name your price with tradesmen, then pay from the board.
              </span>
            </li>
          </ul>
          <Link
            href="/request/checkin"
            className="mt-8 flex w-full sm:inline-flex sm:w-auto"
          >
            <Button
              variant="accent"
              size="lg"
              className="h-14 w-full px-8 text-lg sm:w-auto"
            >
              Start your check-in
            </Button>
          </Link>
        </section>

        <section
          aria-label="What owners say"
          className={`${frame} pb-12 sm:pb-16`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gv-teal-bright)]">
            What owners say
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Visits that stay on the record
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <figure key={item.name} className="min-w-0">
                <blockquote className="font-display text-xl font-medium leading-snug tracking-[-0.03em] sm:text-2xl">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {item.name}
                  </span>
                  {" · "}
                  {item.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
