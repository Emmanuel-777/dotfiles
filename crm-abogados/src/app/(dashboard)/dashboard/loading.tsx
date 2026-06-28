import { StatsSkeleton, TableSkeleton, Skeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36 rounded-lg" />
        ))}
      </div>
      <div className="mb-8">
        <StatsSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TableSkeleton rows={4} />
        <TableSkeleton rows={4} />
        <TableSkeleton rows={4} />
      </div>
    </div>
  )
}
