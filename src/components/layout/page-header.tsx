import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
  backHref,
}: {
  title: ReactNode;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  backHref?: string;
}) {
  return (
    <div className="mb-6">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[length:var(--app-title-size)] font-bold tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-[length:var(--app-muted-size)] leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="w-full shrink-0 sm:w-auto">
            <Button variant="accent" className="w-full sm:w-auto">
              {actionLabel}
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-[linear-gradient(160deg,var(--gv-mist)_0%,var(--card)_55%,rgba(212,243,74,0.14)_100%)] px-6 py-16 text-center">
      <div className="pointer-events-none absolute -right-8 top-4 h-24 w-24 rounded-full bg-[var(--gv-signal)]/25 blur-2xl" />
      <h2 className="relative font-display text-xl font-semibold">{title}</h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {href && actionLabel ? (
        <Link href={href} className="relative mt-6 inline-block">
          <Button variant="accent">{actionLabel}</Button>
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </p>
  );
}
