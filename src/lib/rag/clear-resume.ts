import { getDb } from "@/db";
import * as schema from "@/db/schema";

export async function clearAllResumes() {
  const db = getDb();
  await db.delete(schema.resumes);
}
