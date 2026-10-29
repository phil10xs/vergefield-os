import type { ChecklistItem } from "@/db/schema";
import type { ReportSectionKey } from "./checklist-template";

export function sectionText(
  section: ReportSectionKey,
  note: string | null,
  items: ChecklistItem[],
  narration: string | null,
): string {
  const lines: string[] = [];
  if (note) lines.push(note);
  const done = items.filter((item) => item.checked).length;
  lines.push(`Checklist: ${done}/${items.length} complete.`);
  for (const item of items.filter((item) => !item.checked)) {
    lines.push(
      `Follow up: ${item.label}${item.note ? ` — ${item.note}` : ""}`,
    );
  }
  for (const item of items.filter((item) => item.checked && item.note)) {
    lines.push(`${item.label} — ${item.note}`);
  }
  if (section === "site_condition" && narration) {
    lines.push(`Site notes: ${narration}`);
  }
  return lines.join("\n");
}
