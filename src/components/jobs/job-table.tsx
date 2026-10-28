import Link from "next/link";
import {
  JobPriorityBadge,
  JobSourceBadge,
  JobStatusBadge,
} from "@/components/ui/status-badge";
import type { Job } from "@/db/schema";

export function JobTable({ jobs }: { jobs: Job[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">Job</th>
            <th className="hidden px-4 py-3 font-semibold sm:table-cell">
              Site
            </th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">
              Source
            </th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">
              Priority
            </th>
            <th className="hidden px-4 py-3 font-semibold lg:table-cell">
              Assignee
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border/60 last:border-0 hover:bg-secondary/50"
            >
              <td className="px-4 py-3 font-semibold">
                <Link
                  href={`/jobs/${item.id}`}
                  className="text-link hover:underline"
                >
                  {item.title}
                </Link>
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                {item.siteName ?? "—"}
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <JobSourceBadge source={item.source} />
              </td>
              <td className="px-4 py-3">
                <JobStatusBadge status={item.status} />
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <JobPriorityBadge priority={item.priority} />
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                {item.assignee ?? "Unassigned"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
