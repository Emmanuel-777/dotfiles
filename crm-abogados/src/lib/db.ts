import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import path from 'path'

const tursoUrl = process.env.TURSO_DATABASE_URL
if (tursoUrl) {
  console.log('[db] Connecting to Turso:', tursoUrl.replace('libsql://', 'https://'))
}

const client = createClient(
  tursoUrl
    ? {
        url: tursoUrl.replace('libsql://', 'https://'),
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
  ]
  for (const sql of statements) {
    await client.execute(sql)
  }
}
