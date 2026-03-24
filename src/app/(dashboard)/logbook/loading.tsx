export default function LogbookLoading() {
  return (
    <div className="min-h-screen bg-[hsl(var(--surface-canvas))]">
      <div className="page-shell px-5 pt-6 space-y-6">
        {/* Greeting bar */}
        <div className="animate-pulse">
          <div className="h-7 w-44 rounded bg-[var(--skeleton-base)] mb-1" />
          <div className="h-4 w-64 rounded bg-[var(--skeleton-base)]" />
        </div>

        {/* Today's schedule list */}
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-36 rounded bg-[var(--skeleton-base)]" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 rounded-xl border border-[hsl(var(--border-muted))] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--skeleton-base)] flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-[var(--skeleton-base)]" />
                <div className="h-3 w-1/3 rounded bg-[var(--skeleton-base)]" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 animate-pulse">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card p-5 rounded-xl border border-[hsl(var(--border-muted))]">
              <div className="h-4 w-20 rounded bg-[var(--skeleton-base)] mb-3" />
              <div className="h-8 w-12 rounded bg-[var(--skeleton-base)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
