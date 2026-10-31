import Link from "next/link";
import type { Metadata } from "next";
import { VergeCareMark } from "@/components/brand/vergecare-mark";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { ExpiredBoardLink } from "@/components/track/expired-link";
import { Button } from "@/components/ui/button";
import { propertyBoardPath, propertySnagPath } from "@/lib/app-url";
import { groupSessionsByPropertyVisit } from "@/lib/sessions";
import { getLandlordAccess } from "@/server/board-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My properties" };

export default async function MyPropertiesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const access = await getLandlordAccess(token);
  if (!access) return <ExpiredBoardLink />;

  const groups = groupSessionsByPropertyVisit(access.jobs);

  return (
    <AppShell>
      <PageHeader
        title="My properties"
        description="Every property on this link. Open a snag list or board to move issues. No password."
        meta={`${groups.length} ${groups.length === 1 ? "property" : "properties"}`}
        actions={
          <Link href="/request" className="flex w-full">
            <Button variant="accent" className="w-full">
              New check-in
            </Button>
          </Link>
        }
      />
      {groups.length === 0 ? (
        <EmptyState
          title="No check-ins on this link yet"
          description="Properties show up here after you check in with this email."
          href="/request"
          actionLabel="New check-in"
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const sessions = group.visits.flatMap((visit) => visit.sessions);
            const openCount = sessions.filter(
              (session) =>
                session.status !== "paid" &&
                session.status !== "cancelled",
            ).length;
            const lastVisit = group.visits[0]?.label ?? "No visits yet";
            return (
              <li key={group.address} className="min-w-0">
                <article className="flex h-full flex-col rounded-2xl border border-border bg-card px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <VergeCareMark decorative className="h-11 w-11 rounded-xl" />
                    <span className="min-w-0">
                      <span className="block font-display text-base font-bold tracking-tight break-words">
                        {group.address}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {group.sessionCount}{" "}
                        {group.sessionCount === 1 ? "issue" : "issues"} ·{" "}
                        {openCount} open · Last visit {lastVisit}
                      </span>
                    </span>
                  </div>
                  <nav
                    aria-label={`${group.address} sections`}
                    className="mt-3 flex items-center gap-1 border-t border-border pt-3 text-sm font-semibold"
                  >
                    <Link
                      href={propertySnagPath(token, group.address)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg text-link hover:underline"
                    >
                      Snag list
                    </Link>
                    <Link
                      href={propertyBoardPath(token, group.address)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg text-link hover:underline"
                    >
                      Board
                    </Link>
                    <span
                      aria-disabled="true"
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-muted-foreground"
                    >
                      Docs
                      <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        Soon
                      </span>
                    </span>
                  </nav>
                </article>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        This link is for {access.email}. It expires 7 days after it was last
        refreshed.
      </p>
    </AppShell>
  );
}
