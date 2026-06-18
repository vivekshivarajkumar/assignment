"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { IconSpark } from "./icons";
import {
  normalizeTailoredContent,
  resumeMarkdownToElements,
} from "@/lib/resume-markdown";
import { downloadResumePdf } from "@/lib/resume-pdf";

interface TailoredResumePanelProps {
  jobId: string;
  resumeId: string | null;
  initialContent?: string | null;
  guardrailPassed?: boolean;
  jobTitle: string;
  company: string;
}

function looksLikeTemplate(content: string | null | undefined): boolean {
  if (!content) return false;
  return (
    content.includes("Set GEMINI_API_KEY") ||
    content.includes("AI provider not configured")
  );
}

function filenamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildDownloadName(jobTitle: string, company: string): string {
  return ["tailored-resume", filenamePart(company), filenamePart(jobTitle)]
    .filter(Boolean)
    .join("-");
}

export function TailoredResumePanel(props: TailoredResumePanelProps) {
  const guardrailPassed = props.guardrailPassed ?? true;
  const initial = looksLikeTemplate(props.initialContent)
    ? ""
    : props.initialContent || "";

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [copied, setCopied] = useState(false);

  async function craftResume(regenerate: boolean) {
    if (!props.resumeId) {
      setError("Upload a resume first to craft a tailored version.");
      return;
    }
    setLoading(true);
    setError("");
    setBlocked(false);
    try {
      const res = await fetch(`/api/jobs/${props.jobId}/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: props.resumeId, force: regenerate }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && data.error?.includes("cannot ethically")) {
          setBlocked(true);
        }
        throw new Error(data.error || "Failed");
      }
      setContent(data.content);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  // Auto-craft the first time the dialog opens.
  useEffect(() => {
    if (open && !content && !loading && !error && props.resumeId) {
      void Promise.resolve().then(() => craftResume(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(normalizeTailoredContent(content));
      setCopied(true);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-2xl bg-accent p-4 text-left text-white shadow-[0_14px_30px_-16px_rgba(108,92,231,0.8)] transition-all hover:-translate-y-0.5 hover:bg-accent-hover"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <IconSpark className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">
            {content ? "View tailored resume" : "Craft my resume"}
          </span>
          <span className="block text-xs text-white/80">
            Truthful, role-aligned rewrite you can download
          </span>
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Your tailored resume"
        subtitle={`Tailored for ${props.jobTitle} at ${props.company}`}
      >
        {!guardrailPassed && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Fit scores suggest this role may be a stretch. Tailoring may be
            blocked — try the skill path or adjacent roles first.
          </div>
        )}

        {loading && !content && (
          <div className="flex items-center gap-2.5 py-2 text-sm text-uber-gray-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-uber-gray-200 border-t-accent" />
            Crafting your resume…
          </div>
        )}

        {!props.resumeId && !loading && (
          <p className="text-sm text-uber-gray-500">
            Upload your resume on the home page first.
          </p>
        )}

        {content && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void downloadResumePdf(
                    content,
                    `${buildDownloadName(props.jobTitle, props.company)}.pdf`
                  )
                }
                className="uber-btn-accent !px-4 !py-2 text-sm"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="uber-btn-secondary !px-4 !py-2 text-sm"
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={() => craftResume(true)}
                disabled={loading}
                className="uber-btn-ghost px-2 underline disabled:opacity-40"
              >
                {loading ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto rounded-2xl bg-uber-gray-50 p-4">
              <div className="space-y-1 rounded-md bg-white p-5 ring-1 ring-black/[0.06] sm:p-6">
                {resumeMarkdownToElements(content)}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            className={`mt-4 rounded-lg p-4 text-sm ${
              blocked
                ? "border border-red-200 bg-red-50 text-red-800"
                : "text-red-600"
            }`}
          >
            {error}
          </div>
        )}
      </Modal>
    </>
  );
}
