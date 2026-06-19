import {
  pgTable,
  text,
  integer,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";

export const resumes = pgTable("resumes", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  fileData: text("file_data"),
  fileType: text("file_type"),
  skills: text("skills"),
  profileGraph: text("profile_graph"),
  embedding: text("embedding"),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const jobs = pgTable("jobs", {
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
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const jobMatches = pgTable("job_matches", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  matchPercentage: doublePrecision("match_percentage").notNull(),
  fitBreakdown: text("fit_breakdown"),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const tailoredResumes = pgTable("tailored_resumes", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const careerAssets = pgTable("career_assets", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const jobInsights = pgTable("job_insights", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" })
    .unique(),
  interviewQuestions: text("interview_questions"),
  commonQuestions: text("common_questions"),
  payScale: text("pay_scale"),
  sources: text("sources"),
  fetchedAt: timestamp("fetched_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Resume = typeof resumes.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type JobMatch = typeof jobMatches.$inferSelect;
export type TailoredResume = typeof tailoredResumes.$inferSelect;
export type CareerAsset = typeof careerAssets.$inferSelect;
export type JobInsight = typeof jobInsights.$inferSelect;
