import { getOpenAI, EMBEDDING_MODEL } from "../openai";
import { geminiEmbed, hasGemini } from "../ai/gemini";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "must", "shall", "can", "need",
  "this", "that", "these", "those", "i", "you", "he", "she", "it", "we",
  "they", "my", "your", "our", "their", "as", "if", "then", "than",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export function embedTextLocal(text: string): number[] {
  const dims = 256;
  const tokens = tokenize(text);
  const vec = new Array(dims).fill(0);
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    vec[hash % dims] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function embedText(text: string): Promise<number[]> {
  const truncated = text.slice(0, 8000);

  if (hasGemini()) {
    try {
      return await geminiEmbed(truncated);
    } catch (err) {
      console.warn("Gemini embedding failed, trying OpenAI:", err);
    }
  }

  const openai = getOpenAI();
  if (openai) {
    try {
      const res = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: truncated,
      });
      return res.data[0].embedding;
    } catch (err) {
      console.warn("OpenAI embedding failed, using fallback:", err);
    }
  }

  return embedTextLocal(truncated);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function similarityToPercentage(similarity: number): number {
  const pct = Math.round(Math.max(0, Math.min(1, similarity)) * 100);
  return Math.max(15, pct);
}

export function parseEmbedding(stored: string | null): number[] | null {
  if (!stored) return null;
  try {
    return JSON.parse(stored) as number[];
  } catch {
    return null;
  }
}

export function serializeEmbedding(embedding: number[]): string {
  return JSON.stringify(embedding);
}

export function extractSkills(text: string): string[] {
  const known = [
    "javascript", "typescript", "python", "java", "go", "golang", "rust",
    "react", "next.js", "nextjs", "node.js", "nodejs", "vue", "angular",
    "sql", "postgresql", "mysql", "mongodb", "redis", "sqlite",
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
    "machine learning", "deep learning", "pytorch", "tensorflow", "nlp",
    "rag", "llm", "openai", "git", "ci/cd", "agile", "scrum",
    "html", "css", "tailwind", "graphql", "rest", "api",
    "jenkins", "sonarqube", "groovy", "netlify",
    "spark", "airflow", "kafka", "ruby", "rails", "php", "c++", "c#",
  ];
  const lower = text.toLowerCase();
  return known.filter((skill) => lower.includes(skill));
}
