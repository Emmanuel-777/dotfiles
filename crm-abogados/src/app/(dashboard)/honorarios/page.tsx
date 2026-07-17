import { db, initDB } from '@/lib/db'
import { honorarios, clientes, causas, perfilAbogado, cuotasHonorario } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, DollarSign, TrendingUp, Pencil, MessageCircle } from 'lucide-react'
import { formatMonto, formatFechaCorta, formatPhoneWhatsApp, ESTADOS_HONORARIO, splitHonorarioCobrado } from '@/lib/utils'
import { requireUserId } from '@/lib/auth'
import { decrypt, looksEncrypted } from '@/lib/crypto'
import MonthlyBarChart, { type MonthBucket } from '@/components/MonthlyBarChart'

export const dynamic = 'force-dynamic'

function descifrarSiCorresponde(value: string | null): string | null {
  if (!value) return value
  return looksEncrypted(value) ? decrypt(value) : value
}

function mensajeCobro(params: {
  clienteNombre: string
  descripcion: string
  monto: string
  causaRol?: string | null
  perfil: { banco: string | null; tipoCuenta: string | null; numeroCuenta: string | null; titularNombre: string | null; titularRut: string | null } | null
}): string {
  const { clienteNombre, descripcion, monto, causaRol, perfil } = params
  const lineas = [
    `Estimado/a ${clienteNombre},`,
    ``,
    `Le escribo para recordarle el siguiente honorario pendiente de pago:`,
    ``,
    `📌 ${descripcion}`,
    causaRol ? `⚖️ Causa: ${causaRol}` : '',
    `💰 Monto: ${monto}`,
  ]

  const datosCompletos = perfil && perfil.banco && perfil.tipoCuenta && perfil.numeroCuenta && perfil.titularNombre && perfil.titularRut
  if (datosCompletos) {
    lineas.push(
      ``,
      `Puede realizar la transferencia a:`,
      perfil!.titularNombre!,
      `RUT: ${perfil!.titularRut}`,
      perfil!.banco!,
      perfil!.tipoCuenta!,
      `N° de cuenta: ${perfil!.numeroCuenta}`,
    )
  }

  lineas.push(``, `Le agradecería enviarme su compromiso de pago. ¡Gracias!`)
  return lineas.filter((l) => l !== '').join('\n')
}

function mensajeComprobante(clienteNombre: string, descripcion: string): string {
  return [
    `Estimado/a ${clienteNombre},`,
    ``,
    `Para dejar registrado su pago correspondiente a "${descripcion}", ¿podría enviarnos el comprobante de la transferencia?`,
    ``,
    `Muchas gracias.`,
  ].join('\n')
}

function mensajeConfirmacionPago(clienteNombre: string, descripcion: string, monto: string): string {
  return [
    `Estimado/a ${clienteNombre},`,
    ``,
    `Le confirmamos que su pago de ${monto} correspondiente a "${descripcion}" quedó registrado correctamente en su carpeta.`,
    ``,
    `Muchas gracias.`,
  ].join('\n')
}

export default async function HonorariosPage({ searchParams }: { searchParams: { filtro?: string; mes?: string } }) {
  await initDB()
  const userId = await requireUserId()
  const soloPorCobrar = searchParams.filtro === 'por-cobrar'
  const mesFiltro = searchParams.mes
  const rows = await db
    .select({ honorario: honorarios, cliente: clientes, causa: causas })
    .from(honorarios)
    .leftJoin(clientes, eq(honorarios.clienteId, clientes.id))
    .leftJoin(causas, eq(honorarios.causaId, causas.id))
    .where(eq(honorarios.userId, userId))
    .orderBy(desc(honorarios.createdAt))

  const honorarioIds = rows.map((r) => r.honorario.id)
  const todasCuotas = honorarioIds.length > 0
    ? await db.select().from(cuotasHonorario).where(eq(cuotasHonorario.userId, userId))
    : []

  const [perfilRow] = await db.select().from(perfilAbogado).where(eq(perfilAbogado.userId, userId))
  const perfil = perfilRow
    ? {
        banco: perfilRow.banco,
        tipoCuenta: perfilRow.tipoCuenta,
        numeroCuenta: descifrarSiCorresponde(perfilRow.numeroCuenta),
        titularNombre: perfilRow.titularNombre,
        titularRut: descifrarSiCorresponde(perfilRow.titularRut),
      }
    : null

  const totales = rows.reduce(
    (acc, r) => {
      const { cobrado, pendiente } = splitHonorarioCobrado(r.honorario, todasCuotas.filter((c) => c.honorarioId === r.honorario.id))
      acc.pagado += cobrado
      acc.pendiente += pendiente
      acc.total += r.honorario.monto
      return acc
    },
    { pendiente: 0, pagado: 0, total: 0 },
  )

  // Base para tasa de cobro: todo lo emitido (excluye anulados)
  const emitidoBase = rows.filter((r) => r.honorario.estado !== 'ANULADO').reduce((s, r) => s + r.honorario.monto, 0)
  const tasaCobro = emitidoBase > 0 ? Math.round((totales.pagado / emitidoBase) * 100) : 0

  // Proyección de ingresos por mes: cada honorario PARCIAL se reparte en el
  // mes de vencimiento de CADA una de sus cuotas (no todo en un solo mes),
  // para que se vea el efecto real de aceptar pagos parciales sobre el flujo
  // de caja mensual. Honorarios sin cuotas usan su fecha de vencimiento
  // (o emisión si no tiene). Anulados quedan fuera por completo.
  function claveMes(fecha: string): string {
    const d = new Date(fecha.length === 10 ? fecha + 'T00:00:00' : fecha)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  function labelMes(clave: string): string {
    const [y, m] = clave.split('-').map(Number)
    const texto = new Date(y, m - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  const lineasProyeccion: { mes: string; honorarioId: string; monto: number; cobrado: number; pendiente: number }[] = []
  for (const { honorario: h } of rows) {
    if (h.estado === 'ANULADO') continue
    const cuotasDelHonorario = todasCuotas.filter((c) => c.honorarioId === h.id)
    if (h.estado === 'PARCIAL' && cuotasDelHonorario.length > 0) {
      for (const c of cuotasDelHonorario) {
        lineasProyeccion.push({ mes: claveMes(c.fechaPago), honorarioId: h.id, monto: c.monto, cobrado: c.pagada ? c.monto : 0, pendiente: c.pagada ? 0 : c.monto })
      }
    } else {
      lineasProyeccion.push({
        mes: claveMes(h.fechaVence ?? h.fechaEmision),
        honorarioId: h.id,
        monto: h.monto,
        cobrado: h.estado === 'PAGADO' ? h.monto : 0,
        pendiente: h.estado === 'PAGADO' ? 0 : h.monto,
      })
    }
  }

  const mesesMap = new Map<string, { esperado: number; cobrado: number; pendiente: number }>()
  const honorarioIdsPorMes = new Map<string, Set<string>>()
  for (const l of lineasProyeccion) {
    const actual = mesesMap.get(l.mes) ?? { esperado: 0, cobrado: 0, pendiente: 0 }
    actual.esperado += l.monto
    actual.cobrado += l.cobrado
    actual.pendiente += l.pendiente
    mesesMap.set(l.mes, actual)

    const set = honorarioIdsPorMes.get(l.mes) ?? new Set<string>()
    set.add(l.honorarioId)
    honorarioIdsPorMes.set(l.mes, set)
  }
  const mesesOrdenados = Array.from(mesesMap.entries()).sort(([a], [b]) => a.localeCompare(b))
  const consolidadoGeneral = lineasProyeccion.reduce(
    (acc, l) => ({ esperado: acc.esperado + l.monto, cobrado: acc.cobrado + l.cobrado, pendiente: acc.pendiente + l.pendiente }),
    { esperado: 0, cobrado: 0, pendiente: 0 },
  )
  const honorarioIdsDelMesFiltrado = mesFiltro ? honorarioIdsPorMes.get(mesFiltro) : undefined

  // Filas a mostrar en la tabla — si viene el filtro "por cobrar", solo las
  // que aún tienen saldo pendiente; si viene un mes, solo las que tienen
  // actividad (honorario o alguna cuota) venciendo ese mes. Ambos filtros
  // se pueden combinar. Con "por cobrar" activo, ordena de mayor a menor
  // deuda para ver primero quién debe más.
  const rowsConPendiente = rows.map((r) => ({
    ...r,
    pendienteRow: splitHonorarioCobrado(r.honorario, todasCuotas.filter((c) => c.honorarioId === r.honorario.id)).pendiente,
  }))
  let rowsMostradas = rowsConPendiente
  if (honorarioIdsDelMesFiltrado) rowsMostradas = rowsMostradas.filter((r) => honorarioIdsDelMesFiltrado.has(r.honorario.id))
  if (soloPorCobrar) rowsMostradas = rowsMostradas.filter((r) => r.pendienteRow > 0).sort((a, b) => b.pendienteRow - a.pendienteRow)

  // Buckets de los últimos 6 meses
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const ahora = new Date()
  const buckets: MonthBucket[] = []
  const indexPorClave = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const clave = `${d.getFullYear()}-${d.getMonth()}`
    indexPorClave.set(clave, buckets.length)
    buckets.push({ label: MESES[d.getMonth()], emitido: 0, cobrado: 0 })
  }
  for (const { honorario: h } of rows) {
    if (h.estado === 'ANULADO') continue
    const fe = h.fechaEmision ? new Date(h.fechaEmision) : null
    if (fe && !isNaN(fe.getTime())) {
      const idx = indexPorClave.get(`${fe.getFullYear()}-${fe.getMonth()}`)
      if (idx !== undefined) buckets[idx].emitido += h.monto
    }
    if (h.estado === 'PAGADO') {
      const fp = new Date(h.fechaPago ?? h.fechaEmision)
      if (!isNaN(fp.getTime())) {
        const idx = indexPorClave.get(`${fp.getFullYear()}-${fp.getMonth()}`)
        if (idx !== undefined) buckets[idx].cobrado += h.monto
      }
    }
  }
  const hayDatosGrafico = buckets.some((b) => b.emitido > 0 || b.cobrado > 0)

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Honorarios</h1>
          <p className="text-gray-500 text-sm mt-1">
            {soloPorCobrar || mesFiltro ? `${rowsMostradas.length} de ${rows.length} registros` : `${rows.length} registros`}
          </p>
        </div>
        <Link href="/honorarios/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo honorario
        </Link>
      </div>

      {(soloPorCobrar || mesFiltro) && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-sm text-amber-800">
            {mesFiltro && soloPorCobrar && `Mostrando honorarios con saldo pendiente que vencen en ${labelMes(mesFiltro)}, ordenados de mayor a menor deuda.`}
            {mesFiltro && !soloPorCobrar && `Mostrando honorarios con actividad en ${labelMes(mesFiltro)}.`}
            {!mesFiltro && soloPorCobrar && 'Mostrando solo honorarios con saldo pendiente, ordenados de mayor a menor deuda.'}
          </p>
          <Link href="/honorarios" className="text-sm font-medium text-amber-700 hover:text-amber-900 underline">
            Ver todos
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 border-l-4 border-emerald-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total cobrado</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatMonto(totales.pagado)}</p>
        </div>
        <Link
          href="/honorarios?filtro=por-cobrar"
          className="card p-5 border-l-4 border-amber-400 hover:bg-amber-50/50 transition-colors cursor-pointer"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Por cobrar</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{formatMonto(totales.pendiente)}</p>
          <p className="text-xs text-amber-600 mt-1">Ver quién debe →</p>
        </Link>
        <div className="card p-5 border-l-4 border-blue-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total emitido</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{formatMonto(totales.total)}</p>
        </div>
        <div className="card p-5 border-l-4 border-violet-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> Tasa de cobro
          </p>
          <p className="text-2xl font-bold text-violet-700 mt-1">{tasaCobro}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${tasaCobro}%` }} />
          </div>
        </div>
      </div>

      {hayDatosGrafico && (
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Honorarios por mes — últimos 6 meses</h2>
          <MonthlyBarChart data={buckets} />
        </div>
      )}

      {mesesOrdenados.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700">Proyección de ingresos por mes</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">
            Cada cuota se ubica en el mes en que vence — así se ve el efecto real de aceptar pagos parciales sobre el flujo de caja.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="py-2 pr-4">Mes</th>
                  <th className="py-2 pr-4 text-right">Esperado</th>
                  <th className="py-2 pr-4 text-right">Cobrado</th>
                  <th className="py-2 text-right">Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mesesOrdenados.map(([clave, m]) => (
                  <tr key={clave} className={clave === mesFiltro ? 'bg-amber-50' : ''}>
                    <td className="py-2 pr-4">
                      <Link href={`/honorarios?mes=${clave}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                        {labelMes(clave)}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-900 font-medium">{formatMonto(m.esperado)}</td>
                    <td className="py-2 pr-4 text-right text-emerald-700">{formatMonto(m.cobrado)}</td>
                    <td className="py-2 text-right text-amber-700">{formatMonto(m.pendiente)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td className="py-3 pr-4 font-bold text-gray-900">Consolidado general</td>
                  <td className="py-3 pr-4 text-right font-bold text-gray-900">{formatMonto(consolidadoGeneral.esperado)}</td>
                  <td className="py-3 pr-4 text-right font-bold text-emerald-700">{formatMonto(consolidadoGeneral.cobrado)}</td>
                  <td className="py-3 text-right font-bold text-amber-700">{formatMonto(consolidadoGeneral.pendiente)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">Descripción</th>
              <th className="table-header">Cliente</th>
              <th className="table-header">Causa</th>
              <th className="table-header">Tipo</th>
              <th className="table-header">Fecha</th>
              <th className="table-header text-right">Monto</th>
              <th className="table-header text-center">Estado</th>
              <th className="table-header" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rowsMostradas.length === 0 && (
              <tr>
                <td colSpan={8} className="table-cell text-center text-gray-400 py-8">
                  {soloPorCobrar ? 'Nadie tiene saldo pendiente 🎉' : 'Sin honorarios para este filtro'}
                </td>
              </tr>
            )}
            {rowsMostradas.map(({ honorario: h, cliente, causa, pendienteRow }) => {
              const estadoInfo = ESTADOS_HONORARIO[h.estado as keyof typeof ESTADOS_HONORARIO]
              const montoPendiente = pendienteRow
              const porCobrar = h.estado === 'PENDIENTE' || h.estado === 'PARCIAL'
              const tieneCelular = !!cliente?.celular
              const waCobrarUrl = porCobrar && tieneCelular
                ? `https://wa.me/${formatPhoneWhatsApp(cliente!.celular!)}?text=${encodeURIComponent(
                    mensajeCobro({ clienteNombre: cliente!.nombre, descripcion: h.descripcion, monto: formatMonto(montoPendiente, h.moneda), causaRol: causa?.rol, perfil }),
                  )}`
                : null
              const waComprobanteUrl = h.estado !== 'ANULADO' && tieneCelular
                ? `https://wa.me/${formatPhoneWhatsApp(cliente!.celular!)}?text=${encodeURIComponent(mensajeComprobante(cliente!.nombre, h.descripcion))}`
                : null
              const waConfirmarUrl = h.estado === 'PAGADO' && tieneCelular
                ? `https://wa.me/${formatPhoneWhatsApp(cliente!.celular!)}?text=${encodeURIComponent(mensajeConfirmacionPago(cliente!.nombre, h.descripcion, formatMonto(h.monto, h.moneda)))}`
                : null
              return (
                <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <p className="font-medium text-gray-900">{h.descripcion}</p>
                    {h.fechaVence && <p className="text-xs text-amber-600">Vence: {formatFechaCorta(h.fechaVence)}</p>}
                    {h.fechaPago && <p className="text-xs text-green-600">Pagado: {formatFechaCorta(h.fechaPago)}</p>}
                  </td>
                  <td className="table-cell text-gray-600 text-sm">{cliente?.nombre}</td>
                  <td className="table-cell font-mono text-xs text-gray-500">{causa?.rol || '—'}</td>
                  <td className="table-cell"><span className="badge bg-gray-100 text-gray-700">{h.tipo}</span></td>
                  <td className="table-cell text-gray-600 text-sm">{formatFechaCorta(h.fechaEmision)}</td>
                  <td className="table-cell text-right font-semibold text-gray-900">
                    {soloPorCobrar ? formatMonto(montoPendiente) : formatMonto(h.monto)}
                    {soloPorCobrar && h.estado === 'PARCIAL' && (
                      <p className="text-xs text-gray-400 font-normal">de {formatMonto(h.monto)}</p>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    <span className={`badge ${estadoInfo?.color}`}>{estadoInfo?.label}</span>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Link href={`/honorarios/${h.id}/editar`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Link>
                      {waCobrarUrl && (
                        <a
                          href={waCobrarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium"
                          title="Enviar cobro por WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Cobrar
                        </a>
                      )}
                      {waConfirmarUrl && (
                        <a
                          href={waConfirmarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
                          title="Enviar confirmación de pago por WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Confirmar
                        </a>
                      )}
                      {waComprobanteUrl && (
                        <a
                          href={waComprobanteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium"
                          title="Solicitar comprobante de pago por WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Comprobante
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-gray-500">No hay honorarios registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}
