const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const GEMINI_CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
export const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

export function hasGemini(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

interface GeminiPart {
  text: string;
}

export async function geminiGenerate(
  prompt: string,
  options?: { system?: string; json?: boolean; temperature?: number }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const body: {
    contents: { role: string; parts: GeminiPart[] }[];
    generationConfig: {
      temperature: number;
      responseMimeType?: string;
    };
    systemInstruction?: { parts: GeminiPart[] };
  } = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options?.temperature ?? 0.3,
      ...(options?.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  if (options?.system) {
    body.systemInstruction = { parts: [{ text: options.system }] };
  }

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_CHAT_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

export async function geminiEmbed(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${GEMINI_EMBEDDING_MODEL}`,
        content: { parts: [{ text: text.slice(0, 8000) }] },
      }),
    }
  );

  if (!res.ok) throw new Error("Gemini embedding failed");
  const data = (await res.json()) as {
    embedding?: { values?: number[] };
  };
  const values = data.embedding?.values;
  if (!values?.length) throw new Error("Empty embedding");
  return values;
}
