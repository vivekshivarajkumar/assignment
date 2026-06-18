import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
