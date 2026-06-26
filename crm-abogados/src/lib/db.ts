import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import path from 'path'

const client = createClient(
  process.env.TURSO_DATABASE_URL
    ? {
        url: process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://'),
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
      }
)

export const db = drizzle(client, { schema })

export async function initDB() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS clientes (
      id TEXT PRIMARY KEY,
      rut TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'PERSONA_NATURAL',
      email TEXT,
      telefono TEXT,
      celular TEXT,
      direccion TEXT,
      ciudad TEXT DEFAULT 'Santiago',
      region TEXT DEFAULT 'Región Metropolitana',
      notas TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS causas (
      id TEXT PRIMARY KEY,
      rol TEXT NOT NULL,
      tribunal TEXT NOT NULL,
      tipo_causa TEXT NOT NULL DEFAULT 'Civil',
      materia TEXT,
      estado TEXT NOT NULL DEFAULT 'EN_TRAMITE',
      fecha_ingreso TEXT NOT NULL,
      contraparte TEXT,
      abogado_responsable TEXT,
      descripcion TEXT,
      cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS actuaciones (
      id TEXT PRIMARY KEY,
      fecha TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'OTRO',
      descripcion TEXT NOT NULL,
      resultado TEXT,
      causa_id TEXT NOT NULL REFERENCES causas(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS plazos (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      fecha TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'OTRO',
      estado TEXT NOT NULL DEFAULT 'PENDIENTE',
      notas TEXT,
      causa_id TEXT NOT NULL REFERENCES causas(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS documentos (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'OTRO',
      descripcion TEXT,
      archivo TEXT,
      causa_id TEXT NOT NULL REFERENCES causas(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS honorarios (
      id TEXT PRIMARY KEY,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      moneda TEXT NOT NULL DEFAULT 'CLP',
      estado TEXT NOT NULL DEFAULT 'PENDIENTE',
      tipo TEXT NOT NULL DEFAULT 'HONORARIO',
      fecha_emision TEXT NOT NULL,
      fecha_vence TEXT,
      fecha_pago TEXT,
      notas TEXT,
      cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      causa_id TEXT REFERENCES causas(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tareas (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      estado TEXT NOT NULL DEFAULT 'PENDIENTE',
      prioridad TEXT NOT NULL DEFAULT 'MEDIA',
      fecha_vencimiento TEXT,
      asignado_a TEXT,
      asignado_email TEXT,
      es_derivada INTEGER NOT NULL DEFAULT 0,
      credenciales_portal TEXT,
      notas TEXT,
      causa_id TEXT NOT NULL REFERENCES causas(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS prospectos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '',
      nombre TEXT NOT NULL,
      empresa TEXT,
      email TEXT,
      telefono TEXT,
      origen TEXT DEFAULT 'REFERIDO',
      etapa TEXT NOT NULL DEFAULT 'CONTACTO',
      valor_estimado REAL,
      notas TEXT,
      fecha_contacto TEXT NOT NULL,
      proximo_contacto TEXT,
      cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS citas (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
      causa_id TEXT REFERENCES causas(id) ON DELETE SET NULL,
      fecha TEXT NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fin TEXT,
      tipo TEXT NOT NULL DEFAULT 'PRESENCIAL',
      link_reunion TEXT,
      es_gratuita INTEGER NOT NULL DEFAULT 0,
      valor REAL,
      estado TEXT NOT NULL DEFAULT 'PENDIENTE',
      notas TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
  ]
  for (const sql of statements) {
    await client.execute(sql)
  }

  // Migraciones seguras — ignorar si la columna ya existe
  const migrations = [
    `ALTER TABLE actuaciones ADD COLUMN compromiso TEXT`,
    `ALTER TABLE actuaciones ADD COLUMN fecha_recordatorio TEXT`,
    `ALTER TABLE actuaciones ADD COLUMN recordatorio_enviado INTEGER NOT NULL DEFAULT 0`,
    // Aislamiento de datos por usuario (multi-tenancy)
    `ALTER TABLE clientes ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE causas ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE actuaciones ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE plazos ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE documentos ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE honorarios ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE tareas ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE citas ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`,
    // Conversión de prospecto a cliente
    `ALTER TABLE prospectos ADD COLUMN cliente_id TEXT REFERENCES clientes(id)`,
    // Recordatorio de seguimiento del prospecto
    `ALTER TABLE prospectos ADD COLUMN proximo_contacto TEXT`,
  ]
  for (const m of migrations) {
    try { await client.execute(m) } catch {}
  }
}
