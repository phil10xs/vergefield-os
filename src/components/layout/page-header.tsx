import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  backHref,
  backLabel = "Back",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  meta?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-link hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl flex-1">
          {eyebrow ? (
            <p className="text-sm font-semibold text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-2xl font-bold tracking-tight break-words sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
          {meta ? (
            <p className="mt-2 text-sm font-medium text-foreground">{meta}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="w-full min-w-0 lg:w-80 lg:shrink-0">{actions}</div>
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
    <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center sm:px-8 sm:py-16">
      <h2 className="font-display text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>
      {href && actionLabel ? (
        <Link
          href={href}
          className="mt-6 inline-flex w-full justify-center sm:w-auto"
        >
          <Button variant="accent" className="w-full sm:w-auto">
            {actionLabel}
          </Button>
        </Link>
      ) : null}
    </div>
  );
}

export function Notice({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <CheckCircle2
        className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gv-teal-bright)]"
        aria-hidden
      />
      <div className="min-w-0 text-sm leading-relaxed">
        <p className="font-semibold">{title}</p>
        {children ? (
          <p className="mt-0.5 text-muted-foreground">{children}</p>
        ) : null}
      </div>
    </div>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  );
}
