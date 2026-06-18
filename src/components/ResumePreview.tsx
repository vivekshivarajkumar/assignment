import { resumeMarkdownToElements } from "@/lib/resume-markdown";

interface ResumePreviewProps {
  filename: string;
  content: string;
  skills?: string[];
  label?: string;
  resumeId?: string | null;
  fileType?: string | null;
}

function countWords(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function ResumePreview(props: ResumePreviewProps) {
  const skills = props.skills ?? [];
  const label = props.label ?? "Resume";
  const wordCount = countWords(props.content);
  const isPdf = (props.fileType ?? "").includes("pdf") && !!props.resumeId;
  const fileUrl = props.resumeId
    ? `/api/resume/file?id=${encodeURIComponent(props.resumeId)}`
    : "/api/resume/file";

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(16,18,40,0.04),0_12px_28px_-18px_rgba(16,18,40,0.18)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-uber-gray-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            {label}
          </p>
          <p className="truncate text-sm font-semibold text-black">
            {props.filename}
          </p>
          <p className="mt-0.5 text-xs text-uber-gray-500">
            {isPdf ? "Original PDF" : `${wordCount} words`}
            {skills.length > 0 ? ` · ${skills.length} detected skills` : ""}
          </p>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 8).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {isPdf ? (
        <div className="bg-uber-gray-50 p-2 sm:p-3">
          <iframe
            src={`${fileUrl}#view=FitH`}
            title={props.filename}
            className="h-[32rem] w-full rounded-lg border border-uber-gray-200 bg-white"
          />
        </div>
      ) : (
        <div className="max-h-[28rem] overflow-y-auto bg-uber-gray-50 px-4 py-4">
          <div className="space-y-1 rounded-xl bg-white p-4 ring-1 ring-black/[0.05]">
            {resumeMarkdownToElements(props.content)}
          </div>
        </div>
      )}
    </div>
  );
}
