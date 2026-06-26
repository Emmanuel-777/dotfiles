import { HeaderSkeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="p-8">
      <HeaderSkeleton />
      <TableSkeleton rows={8} />
    </div>
  )
}
