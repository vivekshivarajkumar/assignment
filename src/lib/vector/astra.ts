import { DataAPIClient, type Collection } from "@datastax/astra-db-ts";

const ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT;
const TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;
const COLLECTION = "career_job_vectors";

export function hasAstra(): boolean {
  return Boolean(ENDPOINT && TOKEN);
}

function requireConfig(): { endpoint: string; token: string } {
  if (!ENDPOINT || !TOKEN) {
    throw new Error(
      "Astra DB is not configured. Set ASTRA_DB_API_ENDPOINT and ASTRA_DB_APPLICATION_TOKEN."
    );
  }
  return { endpoint: ENDPOINT, token: TOKEN };
}

let collectionPromise: Promise<Collection> | null = null;

function ensureCollection(dimension: number): Promise<Collection> {
  if (collectionPromise) return collectionPromise;

  collectionPromise = (async () => {
    const { endpoint, token } = requireConfig();
    const db = new DataAPIClient(token).db(endpoint);
    try {
      await db.createCollection(COLLECTION, {
        vector: { dimension, metric: "cosine" },
      });
    } catch {
      // Collection already exists — reuse it.
    }
    return db.collection(COLLECTION);
  })();

  return collectionPromise;
}

export interface JobVector {
  id: string;
  vector: number[];
  title: string;
  company: string;
}

/** Index (upsert) job embeddings into Astra. */
export async function upsertJobVectors(jobs: JobVector[]): Promise<void> {
  if (jobs.length === 0) return;
  const collection = await ensureCollection(jobs[0].vector.length);

  await Promise.all(
    jobs.map((job) =>
      collection.replaceOne(
        { _id: job.id },
        { title: job.title, company: job.company, $vector: job.vector },
        { upsert: true }
      )
    )
  );
}

/** Vector-search Astra for the jobs most similar to a query embedding. */
export async function searchSimilarJobs(
  vector: number[],
  limit: number
): Promise<{ jobId: string; similarity: number }[]> {
  const collection = await ensureCollection(vector.length);

  const docs = await collection
    .find(
      {},
      {
        sort: { $vector: vector },
        limit,
        includeSimilarity: true,
        projection: { _id: true },
      }
    )
    .toArray();

  return docs.map((d) => ({
    jobId: String(d._id),
    similarity: typeof d.$similarity === "number" ? d.$similarity : 0,
  }));
}
