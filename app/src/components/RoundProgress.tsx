"use client";

type RoundProgressProps = {
  paid: number;
  total: number;
};

/** Bar "X dari N sudah setor" (F-5). Kunyit saat berjalan, jade saat penuh. */
export function RoundProgress({ paid, total }: RoundProgressProps) {
  const full = total > 0 && paid >= total;
  const pct = total > 0 ? (paid / total) * 100 : 0;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-ink-soft">Setoran ronde ini</span>
        <span className="font-mono text-[0.875rem] text-ink">
          {paid} <span className="text-muted">dari</span> {total}{" "}
          <span className="text-muted">sudah setor</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={paid}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Progres setoran ronde"
        className="h-3 overflow-hidden rounded-full bg-nila-tint"
      >
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-[400ms] ease-out motion-reduce:transition-none ${
            full ? "bg-jade" : "bg-kunyit"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {full && (
        <p className="mt-2 text-sm font-medium text-jade">
          Pot penuh — ronde siap ditutup.
        </p>
      )}
    </div>
  );
}
