export function StoryCardSkeleton() {
  return (
    <div className="card flex items-start gap-4 p-4 sm:p-5">
      <div className="flex flex-col items-center gap-2 pt-0.5">
        <div className="skeleton h-3 w-5" />
        <div className="skeleton size-10 rounded-lg" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-3 w-12" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="skeleton h-12 w-14 rounded-xl" />
    </div>
  );
}

export function StoryViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card space-y-3 p-5">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-3 w-12" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-2 p-4">
            <div className="skeleton h-3 w-32" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
