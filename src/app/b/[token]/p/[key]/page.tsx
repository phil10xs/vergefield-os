import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ViewBoardButton } from "@/components/request/view-board-button";
import { ExpiredBoardLink } from "@/components/track/expired-link";
import { JobStatusBadge } from "@/components/ui/status-badge";
import { landlordPath } from "@/lib/app-url";
import { formatVisitDay, groupSessionsByPropertyVisit } from "@/lib/sessions";
import { snagListDescription } from "@/lib/view-board";
import {
  landlordLinkEmailed,
  loadPropertyForToken,
} from "@/server/board-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Snag list" };

export default async function PropertySnagPage({
  params,
}: {
  params: Promise<{ token: string; key: string }>;
}) {
  const { token, key } = await params;
  const loaded = await loadPropertyForToken(token, key);
  if (loaded.kind === "expired") return <ExpiredBoardLink />;
  if (loaded.kind === "missing") {
    return (
      <AppShell>
        <PageHeader
          title="Property not on this link"
          description="This address is not one of the properties checked in on this link."
          backHref={landlordPath(loaded.token)}
          backLabel="My properties"
        />
      </AppShell>
    );
  }

  const groups = groupSessionsByPropertyVisit(loaded.jobs);
  const anchor = loaded.jobs[0];
  const linkAlreadySent = await landlordLinkEmailed(loaded.email);

  return (
    <AppShell>
      <PageHeader
        title={loaded.address}
        description={snagListDescription(linkAlreadySent)}
        meta={`${loaded.jobs.length} ${loaded.jobs.length === 1 ? "issue" : "issues"}`}
        backHref={landlordPath(token)}
        backLabel="My properties"
        actions={
          <ViewBoardButton
            jobId={anchor.id}
            knownEmail={loaded.email}
            linkAlreadySent={linkAlreadySent}
          />
        }
      />
      <div className="max-w-3xl">
        {groups.map((group) =>
          group.visits.map((visit) => (
            <section key={visit.day} className="mb-6">
              <h2 className="pb-2 text-sm font-semibold text-muted-foreground">
                Visit · {formatVisitDay(visit.day)}
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {visit.sessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold break-words">
                        {session.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {session.tradesmanTrade ?? "Trade detecting…"}
                      </span>
                    </span>
                    <JobStatusBadge status={session.status} />
                  </li>
                ))}
              </ul>
            </section>
          )),
        )}
      </div>
    </AppShell>
  );
}
