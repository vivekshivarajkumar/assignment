interface MatchBadgeProps {
  percentage: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getStyles(pct: number): string {
  if (pct >= 70)
    return "bg-accent text-white shadow-[0_6px_16px_-8px_rgba(108,92,231,0.7)]";
  if (pct >= 50) return "bg-accent-light text-accent ring-1 ring-accent-ring";
  return "bg-white text-uber-gray-500 ring-1 ring-uber-gray-200";
}

export function MatchBadge({
  percentage,
  size = "md",
  showLabel = true,
}: MatchBadgeProps) {
  const sizeClass =
    size === "lg"
      ? "px-4 py-2 text-base"
      : size === "sm"
        ? "px-2.5 py-1 text-xs"
        : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-semibold tabular-nums ${getStyles(percentage)} ${sizeClass}`}
    >
      {percentage}%{showLabel ? " match" : ""}
    </span>
  );
}
