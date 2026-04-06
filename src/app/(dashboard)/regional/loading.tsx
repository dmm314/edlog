export default function RegionalLoading() {
  return (
    <div className="min-h-screen bg-[hsl(var(--surface-canvas))]">
      {/* Header skeleton */}
      <div className="border-b border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-elevated))]">
        <div className="page-shell pt-8 pb-6">
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-24 rounded bg-[var(--skeleton-base)]" />
            <div className="h-8 w-56 rounded bg-[var(--skeleton-base)]" />
            <div className="h-3 w-40 rounded bg-[var(--skeleton-base)]" />
          </div>
        </div>
      </div>

      <div className="page-shell pt-5 space-y-5">
        {/* 4 stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 rounded-xl border border-[hsl(var(--border-muted))]">
              <div className="h-10 w-10 rounded-xl bg-[var(--skeleton-base)] mb-3" />
              <div className="h-8 w-16 rounded bg-[var(--skeleton-base)] mb-2" />
              <div className="h-3 w-20 rounded bg-[var(--skeleton-base)]" />
            </div>
          ))}
        </div>

        {/* Rankings placeholder */}
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 rounded bg-[var(--skeleton-base)]" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 w-full rounded-xl bg-[var(--skeleton-base)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
