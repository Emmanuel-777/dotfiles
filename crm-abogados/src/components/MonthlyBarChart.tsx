import { formatMonto } from '@/lib/utils'

export interface MonthBucket {
  label: string
  emitido: number
  cobrado: number
}

export default function MonthlyBarChart({ data }: { data: MonthBucket[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.emitido, d.cobrado)))

  return (
    <div>
      <div className="flex items-end justify-between gap-3 sm:gap-5" style={{ height: 180 }}>
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <div className="flex w-full items-end justify-center gap-1" style={{ height: 150 }}>
              <div
                className="w-1/2 max-w-[18px] rounded-t bg-blue-200 transition-all"
                style={{ height: `${(d.emitido / max) * 100}%` }}
                title={`Emitido: ${formatMonto(d.emitido)}`}
              />
              <div
                className="w-1/2 max-w-[18px] rounded-t bg-emerald-500 transition-all"
                style={{ height: `${(d.cobrado / max) * 100}%` }}
                title={`Cobrado: ${formatMonto(d.cobrado)}`}
              />
            </div>
            <span className="text-[11px] font-medium text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-200" /> Emitido</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Cobrado</span>
      </div>
    </div>
  )
}
