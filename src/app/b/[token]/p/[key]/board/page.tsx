import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Notice, PageHeader } from "@/components/layout/page-header";
import { ExpiredBoardLink } from "@/components/track/expired-link";
import { TrackBoard } from "@/components/track/track-board";
import { landlordPath, propertySnagPath } from "@/lib/app-url";
import { BOARD_MOVE_HINT, boardConfettiKind, boardEmailNotice } from "@/lib/view-board";
import { BoardConfetti } from "@/components/track/board-confetti";
import { loadPropertyForToken } from "@/server/board-access";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Property board" };

export default async function PropertyBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; key: string }>;
  searchParams: Promise<{ celebrate?: string; email?: string }>;
}) {
  const { token, key } = await params;
  const { celebrate, email } = await searchParams;
  const loaded = await loadPropertyForToken(token, key);
  if (loaded.kind === "expired") return <ExpiredBoardLink />;
  if (loaded.kind === "missing") {
    return (
      <AppShell>
        <PageHeader
          title="Property not on this link"
          description="This address is not one of the properties checked in on this link."
          backHref={landlordPath(token)}
          backLabel="My properties"
        />
      </AppShell>
    );
  }

  const notice = boardEmailNotice(email);
  const confetti = boardConfettiKind(celebrate, email);

  return (
    <AppShell>
      <BoardConfetti active={confetti !== null} kind={confetti} />
      <PageHeader
        title={loaded.address}
        description={`${BOARD_MOVE_HINT} The emailed link opens every property you've checked in.`}
        meta={`${loaded.jobs.length} ${loaded.jobs.length === 1 ? "issue" : "issues"}`}
        backHref={propertySnagPath(token, loaded.address)}
        backLabel="Snag list"
        actions={
          <Link href={landlordPath(token)} className="flex w-full">
            <Button variant="outline" className="w-full">
              My properties
            </Button>
          </Link>
        }
      />
      {notice ? (
        <p className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed">
          {notice}
        </p>
      ) : null}
      {celebrate === "1" && confetti !== "arrival" ? (
        <Notice title="Issue moved to Completed.">
          One more fix off the list.
        </Notice>
      ) : null}
      <TrackBoard
        jobs={loaded.jobs}
        boardToken={token}
        propertyKey={key}
        backHref={propertySnagPath(token, loaded.address)}
        backLabel="Back to snag list"
      />
    </AppShell>
  );
}
