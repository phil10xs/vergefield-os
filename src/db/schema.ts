import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const job = pgTable("job", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  siteName: text("site_name"),
  status: text("status").notNull().default("planned"),
  priority: text("priority").notNull().default("medium"),
  assignee: text("assignee"),
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
  mediaUrls: text("media_urls").array(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Job = typeof job.$inferSelect;
export type NewJob = typeof job.$inferInsert;
export type SiteReport = typeof siteReport.$inferSelect;
export type NewSiteReport = typeof siteReport.$inferInsert;
