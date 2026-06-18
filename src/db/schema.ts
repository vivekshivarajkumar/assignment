import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const resumes = sqliteTable("resumes", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  fileData: text("file_data"),
  fileType: text("file_type"),
  skills: text("skills"),
  profileGraph: text("profile_graph"),
  embedding: text("embedding"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  url: text("url"),
  description: text("description").notNull(),
  requirements: text("requirements"),
  location: text("location"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  source: text("source").default("seed"),
  structuredProfile: text("structured_profile"),
  embedding: text("embedding"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const jobMatches = sqliteTable("job_matches", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  matchPercentage: real("match_percentage").notNull(),
  fitBreakdown: text("fit_breakdown"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const tailoredResumes = sqliteTable("tailored_resumes", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const careerAssets = sqliteTable("career_assets", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const jobInsights = sqliteTable("job_insights", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" })
    .unique(),
  interviewQuestions: text("interview_questions"),
  commonQuestions: text("common_questions"),
  payScale: text("pay_scale"),
  sources: text("sources"),
  fetchedAt: integer("fetched_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Resume = typeof resumes.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type JobMatch = typeof jobMatches.$inferSelect;
export type TailoredResume = typeof tailoredResumes.$inferSelect;
export type CareerAsset = typeof careerAssets.$inferSelect;
export type JobInsight = typeof jobInsights.$inferSelect;
