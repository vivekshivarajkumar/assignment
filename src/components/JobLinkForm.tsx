"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "paste" | "url";

export function JobLinkForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("paste");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body =
        mode === "url"
          ? { url }
          : {
              title: title.trim() || "Target Role",
              company: company.trim() || "Target Company",
              description: description.trim(),
            };

      const res = await fetch("/api/jobs/add-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add job");

      if (mode === "url") setUrl("");
      else {
        setTitle("");
        setCompany("");
        setDescription("");
      }

      router.refresh();

      if (data.job?.id) {
        router.push(`/jobs/${data.job.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    mode === "url" ? url.length > 0 : description.trim().length >= 50;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-uber-gray-50 p-1">
        <button
          type="button"
          onClick={() => setMode("paste")}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
            mode === "paste"
              ? "bg-white text-black shadow-sm"
              : "text-uber-gray-500"
          }`}
        >
          Paste job
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
            mode === "url"
              ? "bg-white text-black shadow-sm"
              : "text-uber-gray-500"
          }`}
        >
          Job URL
        </button>
      </div>

      {mode === "paste" ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Job title"
              className="uber-input !py-2 text-sm"
            />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company"
              className="uber-input !py-2 text-sm"
            />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste job description & requirements…"
            rows={4}
            className="uber-input resize-none text-sm"
          />
        </>
      ) : (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://company.com/careers/role"
          className="uber-input !py-2 text-sm"
        />
      )}

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="uber-btn-secondary w-full !py-2.5 text-sm"
      >
        {loading ? "Analyzing…" : "Craft resume for this job"}
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
