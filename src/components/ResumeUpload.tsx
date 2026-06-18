"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconDocument } from "./icons";
import { ResumePreview } from "./ResumePreview";

interface ResumeUploadProps {
  initialResume?: {
    id: string;
    filename: string;
    content: string;
    skills?: string[];
    fileType?: string | null;
  } | null;
}

export function ResumeUpload({ initialResume = null }: ResumeUploadProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState<{
    id: string | null;
    filename: string;
    content: string;
    skills: string[];
    fileType: string | null;
  } | null>(
    initialResume
      ? {
          id: initialResume.id,
          filename: initialResume.filename,
          content: initialResume.content,
          skills: initialResume.skills ?? [],
          fileType: initialResume.fileType ?? null,
        }
      : null
  );
  const [dragOver, setDragOver] = useState(false);
  const [showForm, setShowForm] = useState(!initialResume);

  async function upload(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploaded({
        id: data.resumeId ?? null,
        filename: data.filename,
        content: data.content,
        skills: data.skills ?? [],
        fileType: data.fileType ?? null,
      });
      setText("");
      setShowForm(false);

      router.refresh();

      requestAnimationFrame(() => {
        document
          .getElementById("your-matches")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    await upload(form);
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData();
    form.append("text", text);
    await upload(form);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleReplace() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/resume", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to clear resume");
      }
      setUploaded(null);
      setShowForm(true);
      setText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear resume");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {uploaded && (
        <ResumePreview
          filename={uploaded.filename}
          content={uploaded.content}
          skills={uploaded.skills}
          resumeId={uploaded.id}
          fileType={uploaded.fileType}
        />
      )}

      {uploaded && !showForm && (
        <button
          type="button"
          onClick={handleReplace}
          disabled={loading}
          className="uber-btn-ghost text-sm underline disabled:opacity-40"
        >
          Replace resume
        </button>
      )}

      {showForm && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:p-8 ${
              dragOver
                ? "border-accent bg-accent-light"
                : "border-uber-gray-200 bg-uber-gray-50/60"
            }`}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-[0_10px_24px_-10px_rgba(108,92,231,0.8)]">
              <IconDocument className="h-6 w-6" />
            </div>
            <p className="font-semibold text-black">Drop resume or choose file</p>
            <p className="mb-4 text-xs text-uber-gray-500">PDF or TXT</p>
            <label className="uber-btn-primary cursor-pointer !px-4 !py-2 text-sm">
              Choose file
              <input
                type="file"
                accept=".pdf,.txt,.md"
                className="hidden"
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          </div>

          <form onSubmit={handlePasteSubmit} className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Or paste resume text here…"
              rows={5}
              className="uber-input resize-none text-sm"
            />
            <button
              type="submit"
              disabled={loading || text.length < 50}
              className="uber-btn-accent w-full !py-3 text-sm disabled:bg-uber-gray-100 disabled:text-uber-gray-400 disabled:shadow-none"
            >
              {loading ? "Matching jobs…" : "Upload & match jobs"}
            </button>
          </form>
        </>
      )}

      {loading && (
        <p className="text-center text-sm text-uber-gray-500">
          Parsing resume and scoring against all jobs…
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
