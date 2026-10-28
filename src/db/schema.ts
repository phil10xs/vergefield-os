import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const job = pgTable("job", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  siteName: text("site_name"),
  status: text("status").notNull().default("planned"),
  priority: text("priority").notNull().default("medium"),
  assignee: text("assignee"),
  tradesmanName: text("tradesman_name"),
  tradesmanTrade: text("tradesman_trade"),
  source: text("source").notNull().default("internal"),
  requesterName: text("requester_name"),
  requesterRole: text("requester_role"),
  requesterContact: text("requester_contact"),
  propertyAddress: text("property_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const siteReport = pgTable("site_report", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => job.id, { onDelete: "cascade" }),
  author: text("author"),
  notes: text("notes").notNull(),
  siteCondition: text("site_condition"),
  hazards: text("hazards"),
  materials: text("materials"),
  nextSteps: text("next_steps"),
  mediaUrls: text("media_urls").array(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const siteMedia = pgTable("site_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .references(() => job.id, { onDelete: "cascade" })
    .notNull(),
  kind: text("kind").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  narration: text("narration"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const checklistItem = pgTable("checklist_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .references(() => job.id, { onDelete: "cascade" })
    .notNull(),
  section: text("section").notNull(),
  label: text("label").notNull(),
  checked: boolean("checked").notNull().default(false),
  note: text("note"),
  sort: integer("sort").notNull().default(0),
});

export const jobNotes = pgTable("job_notes", {
  jobId: uuid("job_id")
    .primaryKey()
    .references(() => job.id, { onDelete: "cascade" }),
  siteCondition: text("site_condition"),
  hazards: text("hazards"),
  materials: text("materials"),
  nextSteps: text("next_steps"),
});

export type Job = typeof job.$inferSelect;
export type NewJob = typeof job.$inferInsert;
export type SiteReport = typeof siteReport.$inferSelect;
export type NewSiteReport = typeof siteReport.$inferInsert;
export type SiteMedia = typeof siteMedia.$inferSelect;
export type ChecklistItem = typeof checklistItem.$inferSelect;
