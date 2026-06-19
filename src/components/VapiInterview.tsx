"use client";

import { useEffect, useRef, useState } from "react";
import type VapiClient from "@vapi-ai/web";
import { IconSpark } from "./icons";

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
  const [muted, setMuted] = useState(false);
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
    setMuted(false);
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

  function toggleMute() {
    const next = !muted;
    vapiRef.current?.setMuted?.(next);
    setMuted(next);
  }

  if (!PUBLIC_KEY) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Voice interviews need a Vapi public key. Add{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_VAPI_API_KEY</code>{" "}
        to <code className="rounded bg-amber-100 px-1">.env.local</code>.
      </div>
    );
  }

  const callLive = status === "active";
  const interviewerActive = callLive && speaking;
  const youActive = callLive && !speaking && !muted;
  const lastLine = transcript[transcript.length - 1];

  return (
    <div className="space-y-4">
      {/* Meet-style stage */}
      <div className="rounded-2xl bg-[#0f1014] p-3">
        <div className="grid grid-cols-2 gap-3">
          <Tile
            name="Interviewer"
            sublabel="AI · CareerCrafter"
            active={interviewerActive}
            ring="accent"
            avatar={
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#8b7bf0] text-white">
                <IconSpark className="h-7 w-7" />
              </span>
            }
            statusText={
              status === "connecting"
                ? "Connecting…"
                : interviewerActive
                  ? "Speaking…"
                  : callLive
                    ? "Listening"
                    : "Ready"
            }
          />
          <Tile
            name="You"
            sublabel={muted ? "Muted" : "Microphone on"}
            active={youActive}
            ring="green"
            avatar={
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-white">
                Y
              </span>
            }
            statusText={
              !callLive ? "—" : muted ? "Muted" : youActive ? "Your turn" : "…"
            }
          />
        </div>

        {/* Live caption */}
        {lastLine && (
          <div className="mt-3 rounded-xl bg-black/40 px-4 py-2.5">
            <p className="text-xs font-medium text-white/50">
              {lastLine.role === "user" ? "You" : "Interviewer"}
            </p>
            <p className="text-sm text-white/90">{lastLine.text}</p>
          </div>
        )}

        {/* Control bar */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {callLive && (
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                muted ? "bg-white text-black" : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              <MicIcon muted={muted} />
            </button>
          )}

          {!callLive ? (
            <button
              type="button"
              onClick={start}
              disabled={status === "connecting"}
              className="inline-flex items-center gap-2 rounded-full bg-uber-green px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <PhoneIcon />
              {status === "connecting"
                ? "Connecting…"
                : status === "ended"
                  ? "Start again"
                  : "Start interview"}
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              aria-label="Leave call"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
            >
              <PhoneIcon hang />
            </button>
          )}
        </div>
      </div>

      {transcript.length > 1 && (
        <details className="rounded-xl bg-uber-gray-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-uber-gray-600">
            Full transcript
          </summary>
          <div className="mt-3 space-y-2">
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
        </details>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}

function Tile({
  name,
  sublabel,
  active,
  ring,
  avatar,
  statusText,
}: {
  name: string;
  sublabel: string;
  active: boolean;
  ring: "accent" | "green";
  avatar: React.ReactNode;
  statusText: string;
}) {
  const ringColor = ring === "accent" ? "ring-accent" : "ring-uber-green";
  return (
    <div
      className={`relative flex aspect-[4/3] flex-col items-center justify-center rounded-xl bg-white/[0.04] ring-2 transition-all ${
        active ? `${ringColor} ring-offset-2 ring-offset-[#0f1014]` : "ring-white/10"
      }`}
    >
      <div className={active ? "animate-pulse" : ""}>{avatar}</div>
      <p className="mt-3 text-sm font-semibold text-white">{name}</p>
      <p className="text-xs text-white/50">{sublabel}</p>
      <span className="absolute left-2 top-2 rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white/80">
        {statusText}
      </span>
    </div>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3m0 0h-3m3 0h3M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
      {muted && <path strokeLinecap="round" d="M3 3l18 18" />}
    </svg>
  );
}

function PhoneIcon({ hang }: { hang?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 ${hang ? "rotate-[135deg]" : ""}`}>
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.18Z" />
    </svg>
  );
}
