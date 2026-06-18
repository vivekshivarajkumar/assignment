import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import { seedJobsIfEmpty } from "./seed";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "resume-jobs.db");

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function runMigrations(sqlite: Database.Database) {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (fs.existsSync(migrationsFolder)) {
    migrate(drizzle(sqlite, { schema }), { migrationsFolder });
  } else {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        content TEXT NOT NULL,
        file_data TEXT,
        file_type TEXT,
        skills TEXT,
        profile_graph TEXT,
        embedding TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS jobs (
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
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS job_matches (
        id TEXT PRIMARY KEY,
        resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        match_percentage REAL NOT NULL,
        fit_breakdown TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tailored_resumes (
        id TEXT PRIMARY KEY,
        resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS career_assets (
        id TEXT PRIMARY KEY,
        resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        asset_type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS job_insights (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
        interview_questions TEXT,
        common_questions TEXT,
        pay_scale TEXT,
        sources TEXT,
        fetched_at INTEGER NOT NULL
      );
    `);
  }

  const alters = [
    "ALTER TABLE resumes ADD COLUMN profile_graph TEXT",
    "ALTER TABLE resumes ADD COLUMN file_data TEXT",
    "ALTER TABLE resumes ADD COLUMN file_type TEXT",
    "ALTER TABLE jobs ADD COLUMN structured_profile TEXT",
    "ALTER TABLE job_matches ADD COLUMN fit_breakdown TEXT",
  ];
  for (const sql of alters) {
    try {
      sqlite.exec(sql);
    } catch {
      /* column exists */
    }
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS career_assets (
      id TEXT PRIMARY KEY,
      resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      asset_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}

export function getDb() {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  runMigrations(sqlite);
  dbInstance = drizzle(sqlite, { schema });

  seedJobsIfEmpty(dbInstance).catch(console.error);

  return dbInstance;
}
