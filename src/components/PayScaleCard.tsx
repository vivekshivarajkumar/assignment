import { faviconUrl } from "@/lib/job-source";

interface PayScale {
  min: number | null;
  max: number | null;
  median: number | null;
  currency: string;
  source: string;
  notes: string;
}

function formatMoney(n: number | null, currency: string): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function PayScaleCard({
  payScale,
  sourceDomain,
}: {
  payScale: PayScale;
  sourceDomain?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-5">
      <div className="uber-card p-5 sm:col-span-3">
        <p className="uber-section-title">Pay range</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-black">
          {payScale.min || payScale.max
            ? `${formatMoney(payScale.min, payScale.currency)} – ${formatMoney(payScale.max, payScale.currency)}`
            : "Not available"}
        </p>
        {payScale.median && (
          <p className="mt-1 text-sm text-uber-gray-500">
            Median {formatMoney(payScale.median, payScale.currency)}
          </p>
        )}
      </div>
      <div className="uber-card p-5 sm:col-span-2">
        <p className="uber-section-title">Source</p>
        <div className="mt-2 flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent-light ring-1 ring-black/[0.05]">
            {sourceDomain ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrl(sourceDomain, 32)}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 rounded-sm"
              />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5 8.5 8l3.5 3.5L21 3M21 3h-5m5 0v5M3 21h18" />
              </svg>
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-black">{payScale.source}</p>
            <p className="mt-0.5 text-sm text-uber-gray-500">{payScale.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
