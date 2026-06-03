export function SkeletonLoader({ className = '', lines = 1 }) {
  if (lines > 1) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton-pulse h-4 rounded-lg"
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </div>
    )
  }

  return <div className={`skeleton-pulse rounded-2xl ${className}`} />
}

export function CardSkeleton({ className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-5 ${className}`}>
      <SkeletonLoader className="mb-3 h-4 w-1/3" />
      <SkeletonLoader className="mb-2 h-8 w-1/2" />
      <SkeletonLoader className="h-3 w-2/3" />
    </div>
  )
}
