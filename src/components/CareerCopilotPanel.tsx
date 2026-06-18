"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { VapiInterview } from "./VapiInterview";
import { IconDocument, IconBriefcase, IconLink, IconSpark } from "./icons";

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-2 text-sm text-uber-gray-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-uber-gray-200 border-t-accent" />
      {label}
    </div>
  );
}

interface CareerCopilotPanelProps {
  jobId: string;
  resumeId: string | null;
  jobTitle: string;
  company: string;
}

type Tab = "cover" | "skills" | "network" | "interview";

const TOOLS: {
  id: Tab;
  label: string;
  desc: string;
  icon: (p: { className?: string }) => React.ReactNode;
}[] = [
  { id: "cover", label: "Cover letter", desc: "Role-specific letter from your resume", icon: IconDocument },
  { id: "skills", label: "Skill path", desc: "Personalized learning plan", icon: IconBriefcase },
  { id: "network", label: "Networking", desc: "Outreach message drafts", icon: IconLink },
  { id: "interview", label: "Mock interview", desc: "Adaptive practice with feedback", icon: IconSpark },
];

export function CareerCopilotPanel({
  jobId,
  resumeId,
  jobTitle,
  company,
}: CareerCopilotPanelProps) {
  const [active, setActive] = useState<Tab | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [skillPath, setSkillPath] = useState<{
    weeks: number;
    prioritySkills: string[];
    milestones: { week: number; focus: string; actions: string[] }[];
    recommendedCourses?: {
      title: string;
      weeks: number;
      level: string;
      skills: string[];
    }[];
  } | null>(null);
  const [networkMsg, setNetworkMsg] = useState("");
  const [networkContext, setNetworkContext] = useState("recruiter");

  function openTool(id: Tab) {
    setError("");
    setActive(id);
  }

  async function generateCover() {
    if (!resumeId) return setError("Upload a resume first.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoverLetter(data.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function generateSkills() {
    if (!resumeId) return setError("Upload a resume first.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/skill-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSkillPath(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function generateNetwork(ctx: string = networkContext) {
    if (!resumeId) return setError("Upload a resume first.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/networking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, context: ctx }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNetworkMsg(data.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  // Auto-run the tool the moment its dialog opens (no extra button).
  useEffect(() => {
    if (!active || loading) return;
    const run =
      active === "cover" && !coverLetter
        ? generateCover
        : active === "skills" && !skillPath
          ? generateSkills
          : active === "network" && !networkMsg
            ? () => generateNetwork()
            : null;
    if (run) void Promise.resolve().then(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const activeTool = TOOLS.find((t) => t.id === active) ?? null;

  return (
    <div className="uber-card p-6">
      <h3 className="uber-heading-lg !text-xl">Career copilot</h3>
      <p className="mt-1 text-sm text-uber-gray-500">
        Cover letters, skill paths, networking, and mock interviews
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => openTool(t.id)}
            className="group flex items-center gap-3 rounded-2xl border border-uber-gray-200 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent-ring hover:shadow-[0_12px_28px_-18px_rgba(76,68,180,0.4)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent">
              <t.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-black group-hover:text-accent">
                {t.label}
              </span>
              <span className="block text-xs text-uber-gray-500">{t.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={activeTool?.label ?? ""}
        subtitle={activeTool?.desc}
      >
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {active === "cover" && (
          <div className="space-y-4">
            {loading && !coverLetter && <LoadingRow label="Writing your cover letter…" />}
            {coverLetter && (
              <>
                <pre className="whitespace-pre-wrap rounded-lg bg-uber-gray-50 p-5 text-sm leading-relaxed text-uber-gray-600">
                  {coverLetter}
                </pre>
                <button
                  onClick={() => generateCover()}
                  disabled={loading}
                  className="uber-btn-ghost underline"
                >
                  {loading ? "Regenerating…" : "Regenerate"}
                </button>
              </>
            )}
          </div>
        )}

        {active === "skills" && (
          <div className="space-y-4">
            {loading && !skillPath && <LoadingRow label="Building your skill path…" />}
            {skillPath && (
              <div className="space-y-4">
                <p className="text-sm text-uber-gray-500">
                  {skillPath.weeks}-week plan · Priority:{" "}
                  {skillPath.prioritySkills.join(", ") || "general readiness"}
                </p>

                {skillPath.recommendedCourses &&
                  skillPath.recommendedCourses.length > 0 && (
                    <div className="rounded-2xl bg-accent-light p-4">
                      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M12 2l2.39 6.96L21 11.35l-6.61 2.39L12 21l-2.39-6.96L3 11.35l6.61-2.39L12 2z" />
                        </svg>
                        Recommended CareerCrafter Academy courses
                      </p>
                      <div className="space-y-2">
                        {skillPath.recommendedCourses.map((c) => (
                          <div
                            key={c.title}
                            className="flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-black/[0.05]"
                          >
                            <span className="min-w-0 truncate text-sm font-medium text-black">
                              {c.title.replace("CareerCrafter Academy: ", "")}
                            </span>
                            <span className="shrink-0 text-xs font-medium text-uber-gray-500">
                              {c.level} · {c.weeks}w
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {skillPath.milestones.map((m) => (
                  <div key={m.week} className="rounded-lg bg-uber-gray-50 p-4">
                    <p className="font-semibold text-black">
                      Week {m.week} — {m.focus}
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-uber-gray-500">
                      {m.actions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                <button
                  onClick={() => generateSkills()}
                  disabled={loading}
                  className="uber-btn-ghost underline"
                >
                  {loading ? "Rebuilding…" : "Rebuild path"}
                </button>
              </div>
            )}
          </div>
        )}

        {active === "network" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-uber-gray-500">
                Audience
              </label>
              <select
                value={networkContext}
                onChange={(e) => {
                  const v = e.target.value;
                  setNetworkContext(v);
                  generateNetwork(v);
                }}
                disabled={loading}
                className="uber-input max-w-xs"
              >
                <option value="recruiter">Recruiter</option>
                <option value="hiring_manager">Hiring manager</option>
                <option value="alumni">Alumni</option>
                <option value="referral">Referral request</option>
              </select>
            </div>
            {loading && <LoadingRow label="Drafting outreach…" />}
            {networkMsg && !loading && (
              <pre className="whitespace-pre-wrap rounded-lg bg-uber-gray-50 p-5 text-sm leading-relaxed text-uber-gray-600">
                {networkMsg}
              </pre>
            )}
          </div>
        )}

        {active === "interview" && (
          <VapiInterview jobTitle={jobTitle} company={company} />
        )}
      </Modal>
    </div>
  );
}
