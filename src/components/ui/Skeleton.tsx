interface SkeletonProps {
  className?: string;
}

/** Neutral loading block. Compose these to mirror the real layout's shape. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

export function ProjectCardSkeleton() {
  return (
    <div className="card p-0">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true" aria-label="Loading projects">
      {Array.from({ length: count }, (_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ArticleListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading articles">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card flex flex-col gap-4 p-6 sm:flex-row">
          <Skeleton className="h-40 w-full rounded-xl sm:h-32 sm:w-56" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
