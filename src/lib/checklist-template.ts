export const REPORT_SECTIONS = [
  { key: "site_condition", label: "Site Condition" },
  { key: "hazards", label: "Hazards" },
  { key: "materials", label: "Materials" },
  { key: "next_steps", label: "Next Steps" },
] as const;

export type ReportSectionKey =
  (typeof REPORT_SECTIONS)[number]["key"];

export interface ChecklistTemplateItem {
  section: ReportSectionKey;
  label: string;
}

export const CHECKLIST_TEMPLATE: ChecklistTemplateItem[] = [
  { section: "site_condition", label: "Access routes clear and signed" },
  { section: "site_condition", label: "Work area tidy, waste segregated" },
  {
    section: "site_condition",
    label: "Weather protection in place where needed",
  },
  { section: "hazards", label: "No exposed wiring or live services" },
  { section: "hazards", label: "Openings and edges guarded" },
  { section: "hazards", label: "Hot works permit checked (if any)" },
  { section: "materials", label: "Materials stored off ground and covered" },
  { section: "materials", label: "Deliveries match the purchase order" },
  { section: "materials", label: "Shortages logged for reorder" },
  { section: "next_steps", label: "Snags photographed and assigned" },
  { section: "next_steps", label: "Follow-up visit agreed with client" },
  { section: "next_steps", label: "Tools and plant secured or removed" },
];
