"use client";

import { useEffect, useRef, useState } from "react";
import type VapiClient from "@vapi-ai/web";

interface VapiInterviewProps {
  jobTitle: string;
  company: string;
}

type Status = "idle" | "connecting" | "active" | "ended";
type Turn = { role: string; text: string };

interface VapiMessage {
  type?: string;
  transcriptType?: string;
  role?: string;
  transcript?: string;
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

export function VapiInterview({ jobTitle, company }: VapiInterviewProps) {
  const vapiRef = useRef<VapiClient | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      vapiRef.current?.stop?.();
    };
  }, []);

  async function start() {
    if (!PUBLIC_KEY) {
      setError("Voice interview not configured. Set NEXT_PUBLIC_VAPI_API_KEY.");
      return;
    }
    setError("");
    setTranscript([]);
    setStatus("connecting");
    try {
      const { default: Vapi } = await import("@vapi-ai/web");
      const vapi = new Vapi(PUBLIC_KEY);
      vapiRef.current = vapi;

      vapi.on("call-start", () => setStatus("active"));
      vapi.on("call-end", () => {
        setStatus("ended");
        setSpeaking(false);
      });
      vapi.on("speech-start", () => setSpeaking(true));
      vapi.on("speech-end", () => setSpeaking(false));
      vapi.on("message", (message) => {
        const m = message as unknown as VapiMessage;
        if (m?.type === "transcript" && m.transcriptType === "final") {
          setTranscript((prev) => [
            ...prev,
            { role: m.role ?? "assistant", text: m.transcript ?? "" },
          ]);
        }
      });
      vapi.on("error", (e) => {
        const err = e as unknown as { message?: string };
        setError(err?.message || "Voice call error");
        setStatus("ended");
      });

      const systemPrompt = `You are a professional but warm interviewer conducting a mock interview for the role of ${jobTitle} at ${company}. Ask one question at a time, listen, ask natural follow-ups based on the candidate's answers, and adapt difficulty. Cover behavioral and role-specific technical topics. Keep your turns concise (under 40 words). After 4-5 questions, give brief constructive feedback and end politely.`;

      const inlineAssistant = {
        name: "CareerCrafter Interviewer",
        firstMessage: `Hi! I'll be running your mock interview for the ${jobTitle} role at ${company}. Whenever you're ready, tell me a bit about yourself.`,
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: systemPrompt }],
        },
        voice: { provider: "vapi", voiceId: "Elliot" },
        transcriber: { provider: "deepgram", model: "nova-2", language: "en" },
      };

      type StartArg = Parameters<typeof vapi.start>[0];
      if (ASSISTANT_ID) {
        await vapi.start(ASSISTANT_ID);
      } else {
        await vapi.start(inlineAssistant as unknown as StartArg);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start voice call");
      setStatus("ended");
    }
  }

  function stop() {
    vapiRef.current?.stop?.();
    setStatus("ended");
  }

  if (!PUBLIC_KEY) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Voice interviews need a Vapi public key. Add{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_VAPI_API_KEY</code>{" "}
        (and optionally{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_VAPI_ASSISTANT_ID</code>)
        to <code className="rounded bg-amber-100 px-1">.env.local</code>.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-accent to-[#8b7bf0] p-5 text-white shadow-[0_18px_40px_-22px_rgba(91,75,214,0.9)]">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full bg-white ${
              status === "active" ? "animate-pulse" : "opacity-60"
            }`}
          />
          <p className="text-sm font-semibold">
            {status === "idle" && "Voice mock interview"}
            {status === "connecting" && "Connecting…"}
            {status === "active" &&
              (speaking ? "Interviewer speaking…" : "Listening…")}
            {status === "ended" && "Interview ended"}
          </p>
        </div>
        <p className="mt-1 text-sm text-white/80">
          {jobTitle} at {company} · spoken, real-time
        </p>
      </div>

      <div className="flex gap-2">
        {status !== "active" ? (
          <button
            onClick={start}
            disabled={status === "connecting"}
            className="uber-btn-accent"
          >
            {status === "connecting"
              ? "Connecting…"
              : status === "ended"
                ? "Start again"
                : "Start voice interview"}
          </button>
        ) : (
          <button onClick={stop} className="uber-btn-secondary">
            End interview
          </button>
        )}
      </div>

      {transcript.length > 0 && (
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-uber-gray-50 p-4">
          {transcript.map((t, i) => (
            <div key={i} className={t.role === "user" ? "text-right" : "text-left"}>
              <span
                className={`inline-block max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${
                  t.role === "user"
                    ? "bg-accent text-white"
                    : "bg-white text-uber-gray-600 ring-1 ring-black/[0.06]"
                }`}
              >
                {t.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
