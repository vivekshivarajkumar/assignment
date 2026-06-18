"use client";

import { useEffect, useState } from "react";

interface FitBreakdown {
  relatedness: number;
  preparedness: number;
  evidenceCoverage: number;
  atsFit: number;
  seniorityFit: number;
  domainFit: number;
  authenticityRisk: number;
  overallFit: number;
  mustHaveCoverage: number;
  guardrailPassed: boolean;
  guardrailReason?: string;
  explanation: string;
}

interface FitScorePanelProps {
  jobId: string;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const barColor =
    value >= 70 ? "bg-accent" : value >= 45 ? "bg-accent/60" : "bg-uber-gray-400";
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-uber-gray-500">{label}</span>
        <span className="font-semibold tabular-nums text-black">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-uber-gray-100">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export function FitScorePanel({ jobId }: FitScorePanelProps) {
  const [fit, setFit] = useState<FitBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/${jobId}/fit`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setFit(data);
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className="uber-card animate-pulse p-6">
        <div className="h-6 w-1/3 rounded bg-uber-gray-100" />
      </div>
    );
  }

  if (!fit) return null;

  return (
    <div className="uber-card p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="uber-section-title">Overall fit score</p>
          <p
            className={`mt-1 text-4xl font-bold tabular-nums ${
              fit.overallFit >= 70
                ? "text-accent"
                : fit.overallFit >= 50
                  ? "text-black"
                  : "text-uber-gray-500"
            }`}
          >
            {fit.overallFit}
            <span className="text-lg font-normal text-uber-gray-400">/100</span>
          </p>
        </div>
        {!fit.guardrailPassed && (
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            Authenticity guardrail
          </span>
        )}
        {fit.guardrailPassed && fit.overallFit >= 60 && (
          <span className="rounded-full bg-uber-green-light px-3 py-1 text-xs font-medium text-uber-green">
            Ready to tailor
          </span>
        )}
      </div>

      <p className="mb-6 text-sm leading-relaxed text-uber-gray-500">
        {fit.explanation}
      </p>

      {!fit.guardrailPassed && fit.guardrailReason && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {fit.guardrailReason}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreBar label="Relatedness (30%)" value={fit.relatedness} />
        <ScoreBar label="Preparedness (25%)" value={fit.preparedness} />
        <ScoreBar label="Evidence coverage (20%)" value={fit.evidenceCoverage} />
        <ScoreBar label="ATS fit (10%)" value={fit.atsFit} />
        <ScoreBar label="Seniority fit (10%)" value={fit.seniorityFit} />
        <ScoreBar label="Domain fit (5%)" value={fit.domainFit} />
      </div>

      <p className="mt-4 text-xs text-uber-gray-400">
        Must-have skill coverage: {fit.mustHaveCoverage}% · Authenticity risk:{" "}
        {fit.authenticityRisk}/100
      </p>
    </div>
  );
}
