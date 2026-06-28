import { HeaderSkeleton, StatsSkeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="p-4 lg:p-8">
      <HeaderSkeleton />
      <div className="mb-6">
        <StatsSkeleton count={3} />
      </div>
      <TableSkeleton rows={6} />
    </div>
  )
}
