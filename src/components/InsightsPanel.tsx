"use client";

import { useCallback, useState } from "react";
import { InterviewQuestionList } from "./InterviewQuestionList";

interface Insights {
  interviewQuestions: string[];
  commonQuestions: string[];
  payScale: {
    min: number | null;
    max: number | null;
    median: number | null;
    currency: string;
    source: string;
    notes: string;
  };
  sources: string[];
  cached?: boolean;
}

interface InsightsPanelProps {
  jobId: string;
  initialInsights: Insights | null;
}

export function InsightsPanel({ jobId, initialInsights }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insights | null>(initialInsights);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialInsights ? "" : "No insights");

  const load = useCallback(
    async (refresh: boolean) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/jobs/${jobId}/insights${refresh ? "?refresh=true" : ""}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load insights");
        setInsights(data as Insights);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      } finally {
        setLoading(false);
      }
    },
    [jobId]
  );

  if (error || !insights) {
    return (
      <div className="rounded-2xl bg-red-50 p-6">
        <p className="text-sm text-red-700">{error || "No insights"}</p>
        <button
          onClick={() => void load(false)}
          disabled={loading}
          className="uber-btn-ghost mt-3 underline"
        >
          {loading ? "Loading…" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="uber-heading-lg !text-xl">Interview questions</h3>
        <button
          onClick={() => void load(true)}
          disabled={loading}
          className="uber-btn-ghost shrink-0 underline"
        >
          {loading ? "Refreshing…" : "Refresh from web"}
        </button>
      </div>

      <section className="uber-card p-5 sm:p-6">
        <InterviewQuestionList questions={insights.interviewQuestions} />
        <a
          href={`/jobs/${jobId}/questions`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
        >
          More questions
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m13 6 6 6-6 6M5 12h14" />
          </svg>
        </a>
      </section>
    </div>
  );
}
