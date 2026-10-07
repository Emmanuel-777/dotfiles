import { db, initDB } from '@/lib/db'
import { presupuestos, presupuestoEtapas, presupuestoPerfil } from '@/lib/schema'
import { and, asc, desc, eq } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { encrypt, decrypt, looksEncrypted } from '@/lib/crypto'
import { MAX_CUOTAS, type Moneda } from './calculo'
import { TEXTO_CLAUSULAS, TEXTO_GASTOS, TEXTO_PAGO, TEXTO_POR_QUE, type EtapaInput } from './plantillas'

export const ESTADOS = ['BORRADOR', 'ENVIADO', 'ACEPTADO', 'RECHAZADO', 'VENCIDO'] as const
export type EstadoPresupuesto = (typeof ESTADOS)[number]

export interface PresupuestoInput {
  clienteId: string | null
  causaId: string | null
  clienteNombre: string
  clienteRut: string
  pagador: string
  materia: string
  fecha: string
  vigenciaDias: number
  impuestos: 'neutro' | 'bruto' | 'neto'
  moneda: Moneda
  valorUf: number | null
  antecedentes: string
  objetivo: string
  porQue: string
  gastos: string
  condicionesPago: string
  clausulas: string
  exitoActivo: boolean
  exitoAbono: number
  exitoPct: number
  estado: EstadoPresupuesto
  etapas: EtapaInput[]
}

const txt = (v: unknown, max = 8000): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const num = (v: unknown, min = 0, max = 1e12): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0
}

/** Normaliza lo que llega del cliente: nunca se guarda el body tal cual. */
export function sanitizar(body: Record<string, unknown>): PresupuestoInput {
  const etapasRaw = Array.isArray(body.etapas) ? body.etapas.slice(0, 40) : []
  const hoy = new Date().toISOString().slice(0, 10)
  const fecha = typeof body.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.fecha) ? body.fecha : hoy
  const moneda: Moneda = body.moneda === 'UF' ? 'UF' : 'CLP'
  const impuestos = body.impuestos === 'bruto' || body.impuestos === 'neto' ? body.impuestos : 'neutro'
  const estado = (ESTADOS as readonly string[]).includes(String(body.estado)) ? (body.estado as EstadoPresupuesto) : 'BORRADOR'

  return {
    clienteId: txt(body.clienteId, 64) || null,
    causaId: txt(body.causaId, 64) || null,
    clienteNombre: txt(body.clienteNombre, 200),
    clienteRut: txt(body.clienteRut, 20),
    pagador: txt(body.pagador, 400),
    materia: txt(body.materia, 300),
    fecha,
    vigenciaDias: Math.trunc(num(body.vigenciaDias, 1, 365)) || 15,
    impuestos,
    moneda,
    valorUf: moneda === 'UF' && num(body.valorUf) > 0 ? num(body.valorUf) : null,
    antecedentes: txt(body.antecedentes, 8000),
    objetivo: txt(body.objetivo, 8000),
    porQue: txt(body.porQue),
    gastos: txt(body.gastos),
    condicionesPago: txt(body.condicionesPago),
    clausulas: txt(body.clausulas, 16000),
    exitoActivo: body.exitoActivo === true,
    exitoAbono: num(body.exitoAbono),
    exitoPct: num(body.exitoPct, 0, 100),
    estado,
    etapas: etapasRaw.map((raw) => {
      const e = (raw ?? {}) as Record<string, unknown>
      return {
        nombre: txt(e.nombre, 200),
        descripcion: txt(e.descripcion, 2000),
        honorarios: num(e.honorarios),
        abono: num(e.abono),
        cuotas: Math.trunc(num(e.cuotas, 0, MAX_CUOTAS)),
        opcional: e.opcional === true,
        activada: e.activada === true,
        nota: txt(e.nota, 500),
      }
    }),
  }
}

// Antecedentes y objetivo pueden describir hechos de un caso (incluso penal):
// se cifran en reposo igual que los datos bancarios del perfil.
const cifrar = (s: string): string | null => (s ? encrypt(s) : null)
const descifrar = (s: string | null): string => {
  if (!s) return ''
  try { return looksEncrypted(s) ? decrypt(s) : s } catch { return '' }
}

async function siguienteFolio(userId: string, fecha: string): Promise<string> {
  const filas = await db.select({ folio: presupuestos.folio }).from(presupuestos).where(eq(presupuestos.userId, userId))
  const anio = fecha.slice(0, 4)
  const usados = filas
    .map((f) => f.folio.match(new RegExp(`^PL-${anio}-(\\d+)$`)))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => parseInt(m[1], 10))
  return `PL-${anio}-${String((usados.length ? Math.max(...usados) : 0) + 1).padStart(4, '0')}`
}

type Fila = typeof presupuestos.$inferSelect

function aSalida(p: Fila, etapas: (typeof presupuestoEtapas.$inferSelect)[]) {
  return {
    ...p,
    antecedentes: descifrar(p.antecedentes),
    objetivo: descifrar(p.objetivo),
    exitoActivo: p.exitoActivo === 1,
    etapas: etapas
      .sort((a, b) => a.orden - b.orden)
      .map((e) => ({ ...e, opcional: e.opcional === 1, activada: e.activada === 1 })),
  }
}

export async function listarPresupuestos(userId: string) {
  await initDB()
  const filas = await db.select().from(presupuestos).where(eq(presupuestos.userId, userId)).orderBy(desc(presupuestos.createdAt))
  const etapas = await db.select().from(presupuestoEtapas).where(eq(presupuestoEtapas.userId, userId))
  return filas.map((p) => {
    const sal = aSalida(p, etapas.filter((e) => e.presupuestoId === p.id))
    // La lista no necesita los textos sensibles.
    return { ...sal, antecedentes: '', objetivo: '' }
  })
}

export async function obtenerPresupuesto(userId: string, id: string) {
  await initDB()
  const [p] = await db.select().from(presupuestos).where(and(eq(presupuestos.id, id), eq(presupuestos.userId, userId)))
  if (!p) return null
  const etapas = await db.select().from(presupuestoEtapas)
    .where(and(eq(presupuestoEtapas.presupuestoId, id), eq(presupuestoEtapas.userId, userId)))
    .orderBy(asc(presupuestoEtapas.orden))
  return aSalida(p, etapas)
}

function filaEtapa(userId: string, presupuestoId: string, e: EtapaInput, orden: number) {
  return {
    id: nanoid(), userId, presupuestoId, orden,
    nombre: e.nombre, descripcion: e.descripcion || null,
    honorarios: e.honorarios, abono: Math.min(e.abono, e.honorarios || e.abono), cuotas: e.cuotas,
    opcional: e.opcional ? 1 : 0, activada: e.opcional && e.activada ? 1 : 0, nota: e.nota || null,
  }
}

export async function crearPresupuesto(userId: string, d: PresupuestoInput) {
  await initDB()
  const id = nanoid()
  const now = new Date().toISOString()
  const folio = await siguienteFolio(userId, d.fecha)
  await db.insert(presupuestos).values({
    id, userId, folio,
    clienteId: d.clienteId, causaId: d.causaId,
    clienteNombre: d.clienteNombre, clienteRut: d.clienteRut || null, pagador: d.pagador || null,
    materia: d.materia, fecha: d.fecha, vigenciaDias: d.vigenciaDias,
    impuestos: d.impuestos, moneda: d.moneda, valorUf: d.valorUf,
    antecedentes: cifrar(d.antecedentes), objetivo: cifrar(d.objetivo),
    porQue: d.porQue || TEXTO_POR_QUE, gastos: d.gastos || TEXTO_GASTOS,
    condicionesPago: d.condicionesPago || TEXTO_PAGO, clausulas: d.clausulas || TEXTO_CLAUSULAS,
    exitoActivo: d.exitoActivo ? 1 : 0, exitoAbono: d.exitoAbono, exitoPct: d.exitoPct,
    estado: 'BORRADOR', createdAt: now, updatedAt: now,
  })
  if (d.etapas.length) {
    await db.insert(presupuestoEtapas).values(d.etapas.map((e, i) => filaEtapa(userId, id, e, i)))
  }
  return obtenerPresupuesto(userId, id)
}

export async function actualizarPresupuesto(userId: string, id: string, d: PresupuestoInput) {
  await initDB()
  const [existe] = await db.select({ id: presupuestos.id, estado: presupuestos.estado })
    .from(presupuestos).where(and(eq(presupuestos.id, id), eq(presupuestos.userId, userId)))
  if (!existe) return null

  const consultas = [
    db.update(presupuestos).set({
      clienteId: d.clienteId, causaId: d.causaId,
      clienteNombre: d.clienteNombre, clienteRut: d.clienteRut || null, pagador: d.pagador || null,
      materia: d.materia, fecha: d.fecha, vigenciaDias: d.vigenciaDias,
      impuestos: d.impuestos, moneda: d.moneda, valorUf: d.valorUf,
      antecedentes: cifrar(d.antecedentes), objetivo: cifrar(d.objetivo),
      porQue: d.porQue, gastos: d.gastos, condicionesPago: d.condicionesPago, clausulas: d.clausulas,
      exitoActivo: d.exitoActivo ? 1 : 0, exitoAbono: d.exitoAbono, exitoPct: d.exitoPct,
      estado: d.estado, updatedAt: new Date().toISOString(),
    }).where(and(eq(presupuestos.id, id), eq(presupuestos.userId, userId))),
    db.delete(presupuestoEtapas).where(and(eq(presupuestoEtapas.presupuestoId, id), eq(presupuestoEtapas.userId, userId))),
    ...(d.etapas.length ? [db.insert(presupuestoEtapas).values(d.etapas.map((e, i) => filaEtapa(userId, id, e, i)))] : []),
  ] as const
  // Atómico: si algo falla no queda un presupuesto sin etapas.
  await db.batch(consultas as unknown as Parameters<typeof db.batch>[0])
  return obtenerPresupuesto(userId, id)
}

export async function eliminarPresupuesto(userId: string, id: string): Promise<boolean> {
  await initDB()
  const [existe] = await db.select({ id: presupuestos.id }).from(presupuestos)
    .where(and(eq(presupuestos.id, id), eq(presupuestos.userId, userId)))
  if (!existe) return false
  await db.batch([
    db.delete(presupuestoEtapas).where(and(eq(presupuestoEtapas.presupuestoId, id), eq(presupuestoEtapas.userId, userId))),
    db.delete(presupuestos).where(and(eq(presupuestos.id, id), eq(presupuestos.userId, userId))),
  ])
  return true
}

// ── Datos del estudio (membrete) ────────────────────────────────────────────
const CAMPOS_PERFIL = ['abogado', 'titulo', 'documento', 'estudio', 'rutEstudio', 'domicilio', 'correo', 'telefono'] as const
const LOGO_MAX = 420_000 // ~300 KB de imagen en base64

export async function obtenerPerfil(userId: string) {
  await initDB()
  const [p] = await db.select().from(presupuestoPerfil).where(eq(presupuestoPerfil.userId, userId))
  return p ?? null
}

export async function guardarPerfil(userId: string, body: Record<string, unknown>) {
  await initDB()
  const datos: Record<string, string | null> = {}
  for (const c of CAMPOS_PERFIL) datos[c] = txt(body[c], 300) || null
  const logo = typeof body.logo === 'string' && body.logo.startsWith('data:image/') && body.logo.length <= LOGO_MAX ? body.logo : null
  const valores = { ...datos, logo, updatedAt: new Date().toISOString() }
  const previo = await obtenerPerfil(userId)
  if (previo) await db.update(presupuestoPerfil).set(valores).where(eq(presupuestoPerfil.userId, userId))
  else await db.insert(presupuestoPerfil).values({ userId, ...valores })
  return obtenerPerfil(userId)
}
