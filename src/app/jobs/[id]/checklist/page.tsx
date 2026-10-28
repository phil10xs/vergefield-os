import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { saveChecklistAction } from "@/app/actions/jobs";
import { PageHeader } from "@/components/layout/page-header";
import { StageSteps } from "@/components/jobs/stage-steps";
import { Button } from "@/components/ui/button";
import { REPORT_SECTIONS } from "@/lib/checklist-template";
import { ensureChecklist } from "@/server/reporting";
import { db } from "@/db";
import { checklistItem, job, jobNotes } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Checklist" };

const noteInputClass =
  "mt-1 h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [jobRow] = await db.select().from(job).where(eq(job.id, id));
  if (!jobRow) notFound();
  await ensureChecklist(id);
  const items = await db
    .select()
    .from(checklistItem)
    .where(eq(checklistItem.jobId, id))
    .orderBy(asc(checklistItem.sort));
  const [notes] = await db
    .select()
    .from(jobNotes)
    .where(eq(jobNotes.jobId, id));

  return (
    <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
      <PageHeader
        title={`Checklist — ${jobRow.title}`}
        description="Work through each section, add notes where it matters, then generate the report."
        backHref={`/jobs/${jobRow.id}/capture`}
      />
      <StageSteps current="checklist" />

      <form action={saveChecklistAction} className="space-y-6">
        <input type="hidden" name="jobId" value={jobRow.id} />
        <input
          type="hidden"
          name="itemIds"
          value={items.map((item) => item.id).join(",")}
        />
        {REPORT_SECTIONS.map((section) => {
          const sectionItems = items.filter(
            (item) => item.section === section.key,
          );
          const noteValue =
            section.key === "site_condition"
              ? (notes?.siteCondition ?? "")
              : section.key === "hazards"
                ? (notes?.hazards ?? "")
                : section.key === "materials"
                  ? (notes?.materials ?? "")
                  : (notes?.nextSteps ?? "");
          return (
            <section
              key={section.key}
              aria-label={section.label}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <h2 className="font-display text-base font-bold tracking-tight">
                {section.label}
              </h2>
              <ul className="mt-3 space-y-3">
                {sectionItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-border/70 p-3"
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        name={`check-${item.id}`}
                        defaultChecked={item.checked}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--gv-teal-bright)]"
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </label>
                    <input
                      name={`note-${item.id}`}
                      defaultValue={item.note ?? ""}
                      placeholder="Add a note (optional)"
                      className={noteInputClass}
                      aria-label={`Note for ${item.label}`}
                    />
                  </li>
                ))}
              </ul>
              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-semibold">
                  {section.label} notes
                </span>
                <textarea
                  name={section.key}
                  defaultValue={noteValue}
                  rows={3}
                  placeholder={`Anything the report should say about ${section.label.toLowerCase()}…`}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            </section>
          );
        })}

        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="block max-w-sm">
            <span className="mb-1 block text-sm font-semibold">
              Report owner
            </span>
            <input
              name="author"
              defaultValue="Project Engineer"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button type="submit" name="intent" value="save" variant="outline">
              Save progress
            </Button>
            <Button type="submit" name="intent" value="generate" variant="accent">
              Generate report
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
