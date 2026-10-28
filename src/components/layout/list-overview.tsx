import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

function ListHeroArt() {
  return (
    <svg
      width="140"
      height="88"
      viewBox="0 0 140 88"
      fill="none"
      aria-hidden
      className="text-[var(--gv-signal)]"
    >
      <rect
        x="18"
        y="14"
        width="72"
        height="52"
        rx="14"
        className="fill-[var(--gv-ink)]/25 stroke-current"
        strokeWidth="1.5"
      />
      <rect
        x="40"
        y="28"
        width="72"
        height="52"
        rx="14"
        className="fill-[var(--gv-signal)]/90"
      />
      <path
        d="M54 48h28M54 58h18"
        stroke="var(--gv-ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="98" cy="40" r="8" className="fill-[var(--gv-ink)]/80" />
      <circle
        cx="118"
        cy="62"
        r="14"
        className="fill-[var(--gv-teal-bright)]/50 stroke-[var(--gv-signal)]"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ListHero({
  title,
  description,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
  count,
  countLabel,
  icon: Icon,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  count?: number;
  countLabel?: string;
  icon: LucideIcon;
}) {
  const itemWord =
    countLabel ??
    (typeof count === "number" && count === 1 ? "record" : "records");

  return (
    <div className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-border/70 bg-[linear-gradient(125deg,var(--gv-mist)_0%,var(--card)_42%,rgba(212,243,74,0.22)_100%)]">
      <div className="pointer-events-none absolute -left-10 top-0 h-32 w-32 rounded-full bg-[var(--gv-teal)]/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-6 bottom-0 h-28 w-40 rounded-full bg-[var(--gv-signal)]/35 blur-2xl" />

      <div className="relative flex flex-col gap-4 p-5 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between min-[720px]:gap-6 sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_28px_rgba(7,22,23,0.18)]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--gv-ink)] sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                {description}
              </p>
              {typeof count === "number" ? (
                <p className="mt-3 inline-flex items-center rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                  {count} {itemWord}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex w-full min-w-0 items-center gap-4 min-[720px]:w-auto">
          <div className="hidden xl:block" aria-hidden>
            <ListHeroArt />
          </div>
          {secondaryHref || (actionHref && actionLabel) ? (
            <div className="flex w-full min-w-0 flex-col gap-2 min-[720px]:w-auto">
              {secondaryHref && secondaryLabel ? (
                <Link href={secondaryHref} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">
                    {secondaryLabel}
                  </Button>
                </Link>
              ) : null}
              {actionHref && actionLabel ? (
                <Link href={actionHref} className="w-full sm:w-auto">
                  <Button variant="accent" className="w-full sm:w-auto">
                    {actionLabel}
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
