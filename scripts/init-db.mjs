// One-off: create the Postgres schema. Run: node scripts/init-db.mjs
import postgres from "postgres";
import fs from "fs";
import path from "path";

// Load DATABASE_URL from .env.local if not already in env.
if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^DATABASE_URL=(.*)$/);
      if (m) process.env.DATABASE_URL = m[1].trim();
    }
  }
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

await sql`CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY, filename TEXT NOT NULL, content TEXT NOT NULL,
  file_data TEXT, file_type TEXT, skills TEXT, profile_graph TEXT, embedding TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now())`;
await sql`CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, company TEXT NOT NULL, url TEXT,
  description TEXT NOT NULL, requirements TEXT, location TEXT,
  salary_min INTEGER, salary_max INTEGER, source TEXT DEFAULT 'seed',
  structured_profile TEXT, embedding TEXT, created_at TIMESTAMP NOT NULL DEFAULT now())`;
await sql`CREATE TABLE IF NOT EXISTS job_matches (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  match_percentage DOUBLE PRECISION NOT NULL, fit_breakdown TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now())`;
await sql`CREATE TABLE IF NOT EXISTS tailored_resumes (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  content TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT now())`;
await sql`CREATE TABLE IF NOT EXISTS career_assets (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now())`;
await sql`CREATE TABLE IF NOT EXISTS job_insights (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  interview_questions TEXT, common_questions TEXT, pay_scale TEXT, sources TEXT,
  fetched_at TIMESTAMP NOT NULL DEFAULT now())`;
await sql`ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_data TEXT`;
await sql`ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_type TEXT`;

const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
console.log("Tables:", tables.map((t) => t.table_name).join(", "));
await sql.end();
