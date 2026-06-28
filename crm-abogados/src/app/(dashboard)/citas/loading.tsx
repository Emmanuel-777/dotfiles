import { HeaderSkeleton, CardsSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="p-4 lg:p-8">
      <HeaderSkeleton />
      <CardsSkeleton count={6} />
    </div>
  )
}
