import { interviewSource, questionSearchUrl, faviconUrl } from "@/lib/job-source";

interface InterviewQuestionListProps {
  questions: string[];
  /** Offset so source rotation stays distinct across paginated lists. */
  startIndex?: number;
}

export function InterviewQuestionList({
  questions,
  startIndex = 0,
}: InterviewQuestionListProps) {
  return (
    <ul className="space-y-2.5">
      {questions.map((q, i) => {
        const src = interviewSource(startIndex + i);
        return (
          <li
            key={`${startIndex}-${i}`}
            className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 rounded-xl border border-uber-gray-100 p-3.5 transition-colors hover:border-accent-ring"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-light text-xs font-bold text-accent tabular-nums">
                {startIndex + i + 1}
              </span>
              <p className="text-sm leading-relaxed text-uber-gray-600">{q}</p>
            </div>
            <a
              href={questionSearchUrl(q, src.domain)}
              target="_blank"
              rel="noopener noreferrer"
              title={`Source: ${src.label}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-uber-gray-50 px-2.5 py-1 text-xs font-medium text-uber-gray-600 ring-1 ring-black/[0.06] transition-colors hover:text-accent hover:ring-accent-ring"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={faviconUrl(src.domain, 32)}
                alt=""
                width={14}
                height={14}
                className="h-3.5 w-3.5 rounded-sm"
              />
              {src.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
