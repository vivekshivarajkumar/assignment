import Link from "next/link";
import { IconArrowLeft } from "./icons";

interface PageHeaderProps {
  backHref?: string;
  backLabel?: string;
  title?: string;
}

export function PageHeader({
  backHref,
  backLabel = "Home",
  title,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-uber-gray-200 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-uber-gray-50"
          >
            <IconArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        )}
        {title ? (
          <h1 className="truncate text-lg font-bold text-black">{title}</h1>
        ) : (
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-[0_8px_18px_-8px_rgba(108,92,231,0.8)]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2l2.39 6.96L21 11.35l-6.61 2.39L12 21l-2.39-6.96L3 11.35l6.61-2.39L12 2z" />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight text-black">
              CareerCrafter
            </span>
          </Link>
        )}
      </div>
      <span className="hidden shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-uber-gray-500 ring-1 ring-black/[0.06] sm:inline">
        FuturePath Careers
      </span>
    </header>
  );
}
