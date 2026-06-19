import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { seedJobsIfEmpty } from "./seed";

const connectionString = process.env.DATABASE_URL;

let sqlClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let initPromise: Promise<void> | null = null;

function getClient() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Configure your Postgres connection.");
  }
  if (!sqlClient) {
    sqlClient = postgres(connectionString, {
      ssl: "require",
      max: 5,
    });
  }
  return sqlClient;
}

async function ensureSchema(): Promise<void> {
  const sql = getClient();

  await sql`CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    file_data TEXT,
    file_type TEXT,
    skills TEXT,
    profile_graph TEXT,
    embedding TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    url TEXT,
    description TEXT NOT NULL,
    requirements TEXT,
    location TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    source TEXT DEFAULT 'seed',
    structured_profile TEXT,
    embedding TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS job_matches (
    id TEXT PRIMARY KEY,
    resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    match_percentage DOUBLE PRECISION NOT NULL,
    fit_breakdown TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS tailored_resumes (
    id TEXT PRIMARY KEY,
    resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS career_assets (
    id TEXT PRIMARY KEY,
    resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS job_insights (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
    interview_questions TEXT,
    common_questions TEXT,
    pay_scale TEXT,
    sources TEXT,
    fetched_at TIMESTAMP NOT NULL DEFAULT now()
  )`;

  // Idempotent column adds for previously-created tables.
  await sql`ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_data TEXT`;
  await sql`ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_type TEXT`;
}

/** Ensure schema + seed run exactly once. */
export function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureSchema();
      await seedJobsIfEmpty(getDb());
    })().catch((err) => {
      initPromise = null; // allow retry on next call
      throw err;
    });
  }
  return initPromise;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getClient(), { schema });
    void initDb().catch((err) => console.error("DB init failed:", err));
  }
  return dbInstance;
}
