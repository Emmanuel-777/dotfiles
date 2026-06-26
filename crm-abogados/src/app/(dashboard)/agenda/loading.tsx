import { HeaderSkeleton, StatsSkeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="p-8">
      <HeaderSkeleton />
      <div className="mb-8">
        <StatsSkeleton count={4} />
      </div>
      <TableSkeleton rows={6} />
    </div>
  )
}
