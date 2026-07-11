import { db } from '@/lib/db'
import { registrosAuditoria } from '@/lib/schema'
import { nanoid } from '@/lib/nanoid'

export async function registrarAuditoria(params: {
  userId: string
  accion: string
  entidad: string
  entidadId?: string | null
  detalle?: string | null
}): Promise<void> {
  try {
    await db.insert(registrosAuditoria).values({
      id: nanoid(),
      userId: params.userId,
      accion: params.accion,
      entidad: params.entidad,
      entidadId: params.entidadId ?? null,
      detalle: params.detalle ?? null,
    })
  } catch (e) {
    console.error('Error registrando auditoría:', e)
  }
}
