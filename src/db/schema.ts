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
  status: text("status").notNull().default("requested"),
  priority: text("priority").notNull().default("medium"),
  assignee: text("assignee"),
  tradesmanName: text("tradesman_name"),
  tradesmanTrade: text("tradesman_trade"),
  severity: text("severity"),
  costBand: text("cost_band"),
  source: text("source").notNull().default("internal"),
  requesterName: text("requester_name"),
  requesterContact: text("requester_contact"),
  businessName: text("business_name"),
  propertyAddress: text("property_address"),
  paymentStatus: text("payment_status").notNull().default("none"),
  paymentAmount: integer("payment_amount"),
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
  transcript: text("transcript"),
  visualDescription: text("visual_description"),
  detectedTrade: text("detected_trade"),
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

export const boardToken = pgTable("board_token", {
  token: text("token").primaryKey(),
  jobId: uuid("job_id")
    .references(() => job.id, { onDelete: "cascade" })
    .notNull(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Job = typeof job.$inferSelect;
export type NewJob = typeof job.$inferInsert;
export type BoardToken = typeof boardToken.$inferSelect;
export type SiteReport = typeof siteReport.$inferSelect;
export type NewSiteReport = typeof siteReport.$inferInsert;
export type SiteMedia = typeof siteMedia.$inferSelect;
export type ChecklistItem = typeof checklistItem.$inferSelect;
