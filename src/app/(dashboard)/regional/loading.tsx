export default function RegionalLoading() {
  return (
    <div className="min-h-screen bg-[hsl(var(--surface-canvas))]">
      <div className="page-shell px-5 pt-6 space-y-6">
        {/* Role dot + title */}
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-3 h-3 rounded-full bg-[var(--skeleton-base)]" />
          <div className="h-7 w-56 rounded bg-[var(--skeleton-base)]" />
        </div>

        {/* 4 stat cards */}
        <div className="grid grid-cols-2 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 rounded-xl border border-[hsl(var(--border-muted))]">
              <div className="h-4 w-20 rounded bg-[var(--skeleton-base)] mb-3" />
              <div className="h-8 w-16 rounded bg-[var(--skeleton-base)]" />
            </div>
          ))}
        </div>

        {/* Rankings placeholder */}
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-28 rounded bg-[var(--skeleton-base)]" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 w-full rounded-xl bg-[var(--skeleton-base)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
