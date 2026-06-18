import { getOpenAI, CHAT_MODEL, hasOpenAI } from "../openai";
import { geminiGenerate, hasGemini } from "./gemini";

export function hasAI(): boolean {
  return hasGemini() || hasOpenAI();
}

export function getAIProvider(): "gemini" | "openai" | "none" {
  if (hasGemini()) return "gemini";
  if (hasOpenAI()) return "openai";
  return "none";
}

export async function chatComplete(
  system: string,
  user: string,
  options?: { temperature?: number; json?: boolean }
): Promise<string> {
  if (hasGemini()) {
    return geminiGenerate(user, {
      system,
      json: options?.json,
      temperature: options?.temperature,
    });
  }

  const openai = getOpenAI();
  if (openai) {
    const res = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: options?.temperature ?? 0.3,
      ...(options?.json ? { response_format: { type: "json_object" } } : {}),
    });
    const text = res.choices[0]?.message?.content;
    if (text) return text;
  }

  throw new Error("No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY.");
}

export async function chatJSON<T>(
  system: string,
  user: string
): Promise<T> {
  const raw = await chatComplete(system, user, { json: true });
  return JSON.parse(raw) as T;
}
