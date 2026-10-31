"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { openPropertyBoardAction } from "@/app/actions/requests";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useSafeTransition } from "@/components/ui/use-form-action-pending";
import { ErrorText } from "@/components/layout/page-header";
import { classifyLandlordContact, isValidEmail } from "@/lib/board-token";
import { runViewBoardClick, viewBoardHelperText } from "@/lib/view-board";

function useBoardOpen(jobId: string) {
  const router = useRouter();
  const [pending, startTransition, beginSubmit] = useSafeTransition();
  const lock = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);
  const [navError, setNavError] = React.useState<string | null>(null);
  const [fallbackHref, setFallbackHref] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pending) lock.current = false;
  }, [pending]);

  function submit(
    contact: string,
    details?: { name: string; businessName: string | null },
  ) {
    if (lock.current || pending) return;
    lock.current = true;
    beginSubmit();
    setError(null);
    setNavError(null);
    setFallbackHref(null);
    startTransition(async () => {
      try {
        const outcome = await runViewBoardClick({
          open: () => openPropertyBoardAction(jobId, contact, details),
          navigate: (path) => router.push(path),
        });
        if (!outcome.navigated) {
          setNavError(outcome.navError);
          setFallbackHref(outcome.href);
        }
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Could not open the board",
        );
      } finally {
        lock.current = false;
      }
    });
  }

  function clear() {
    setError(null);
    setNavError(null);
    setFallbackHref(null);
  }

  return { pending, error, navError, fallbackHref, setError, clear, submit };
}

function BoardOpenFeedback({
  error,
  navError,
  fallbackHref,
}: {
  error: string | null;
  navError: string | null;
  fallbackHref: string | null;
}) {
  return (
    <>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {navError ? (
        <p className="text-sm text-muted-foreground">
          {navError}{" "}
          {fallbackHref ? (
            <Link href={fallbackHref} className="font-semibold text-link hover:underline">
              Open the board
            </Link>
          ) : null}
        </p>
      ) : null}
    </>
  );
}

function BoardHelperText({
  email,
  linkAlreadySent,
}: {
  email: string;
  linkAlreadySent: boolean;
}) {
  const text = viewBoardHelperText(email, linkAlreadySent);
  const at = text.indexOf(email);
  if (at < 0) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground break-words">
        {text}
      </p>
    );
  }
  return (
    <p className="text-sm leading-relaxed text-muted-foreground break-words">
      {text.slice(0, at)}
      <strong className="text-foreground">{email}</strong>
      {text.slice(at + email.length)}
    </p>
  );
}

export function ViewBoardButton({
  jobId,
  knownEmail,
  linkAlreadySent = false,
  onboarding,
}: {
  jobId: string;
  knownEmail?: string | null;
  linkAlreadySent?: boolean;
  onboarding?: {
    name: string;
    businessName: string;
    contact: string;
  };
}) {
  if (onboarding) {
    return <OnboardingViewBoard jobId={jobId} initial={onboarding} />;
  }
  return (
    <DirectViewBoard
      jobId={jobId}
      knownEmail={knownEmail}
      linkAlreadySent={linkAlreadySent}
    />
  );
}

function DirectViewBoard({
  jobId,
  knownEmail,
  linkAlreadySent,
}: {
  jobId: string;
  knownEmail?: string | null;
  linkAlreadySent: boolean;
}) {
  const known =
    knownEmail && isValidEmail(knownEmail) ? knownEmail.trim() : null;
  const [email, setEmail] = React.useState("");
  const board = useBoardOpen(jobId);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const address = known ?? email;
    if (!isValidEmail(address)) {
      board.setError("Enter a valid email address");
      return;
    }
    board.submit(address);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full min-w-0 flex-col gap-2">
      {known ? (
        <BoardHelperText email={known} linkAlreadySent={linkAlreadySent} />
      ) : (
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          aria-label="Email for your properties link"
          disabled={board.pending}
          className="text-field"
        />
      )}
      <Button
        type="submit"
        variant="accent"
        disabled={board.pending}
        aria-busy={board.pending}
        className="w-full"
      >
        {board.pending
          ? linkAlreadySent
            ? "Opening…"
            : "Sending…"
          : "View Board"}
      </Button>
      <BoardOpenFeedback
        error={board.error}
        navError={board.navError}
        fallbackHref={board.fallbackHref}
      />
    </form>
  );
}

function OnboardingViewBoard({
  jobId,
  initial,
}: {
  jobId: string;
  initial: { name: string; businessName: string; contact: string };
}) {
  const board = useBoardOpen(jobId);
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [name, setName] = React.useState(initial.name);
  const [businessName, setBusinessName] = React.useState(initial.businessName);
  const [contact, setContact] = React.useState(initial.contact);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function close() {
    setOpen(false);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      board.setError("Full name is required");
      return;
    }
    const classified = classifyLandlordContact(contact);
    if (!classified) {
      board.setError(
        contact.includes("@")
          ? "Enter a valid email address"
          : "Enter a phone number or email",
      );
      return;
    }
    board.submit(classified.value, {
      name: trimmedName,
      businessName: businessName.trim() || null,
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="accent"
        className="w-full"
        onClick={() => {
          board.clear();
          setOpen(true);
        }}
      >
        View Board
      </Button>
      {open && mounted
        ? createPortal(
            <Modal label="Open your property board" onClose={close}>
              <form onSubmit={onSubmit} className="flex min-w-0 flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold tracking-tight">
                      Open your property board
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Your details open this property&apos;s issues and bills
                      tracker. The first email sends your properties link.
                      Later properties open on that list. A phone still opens
                      the board.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Close"
                    onClick={close}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-semibold">
                    Full name
                  </span>
                  <input
                    name="requesterName"
                    required
                    autoFocus
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Jordan Lee"
                    disabled={board.pending}
                    className="text-field"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-semibold">
                    Business name{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </span>
                  <input
                    name="businessName"
                    autoComplete="organization"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    placeholder="e.g. Lee Property Care"
                    disabled={board.pending}
                    className="text-field"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-semibold">
                    Phone or email
                  </span>
                  <input
                    name="requesterContact"
                    required
                    autoComplete="on"
                    inputMode="text"
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    placeholder="How should the team reach you?"
                    disabled={board.pending}
                    className="text-field"
                  />
                </label>
                <BoardOpenFeedback
                  error={board.error}
                  navError={board.navError}
                  fallbackHref={board.fallbackHref}
                />
                <Button
                  type="submit"
                  variant="accent"
                  disabled={board.pending}
                  aria-busy={board.pending}
                  className="w-full"
                >
                  {board.pending ? "Opening…" : "View Board"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={close}
                >
                  Back to snag list
                </Button>
              </form>
            </Modal>,
            document.body,
          )
        : null}
    </>
  );
}
