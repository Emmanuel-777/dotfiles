import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { clientes, causas, actuaciones, plazos, documentos, honorarios } from './schema'
import { nanoid } from './nanoid'
import path from 'path'

const client = createClient({ url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}` })
const db = drizzle(client)

async function initDB() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS clientes (id TEXT PRIMARY KEY, rut TEXT NOT NULL UNIQUE, nombre TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'PERSONA_NATURAL', email TEXT, telefono TEXT, celular TEXT, direccion TEXT, ciudad TEXT DEFAULT 'Santiago', region TEXT DEFAULT 'Región Metropolitana', notas TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS causas (id TEXT PRIMARY KEY, rol TEXT NOT NULL, tribunal TEXT NOT NULL, tipo_causa TEXT NOT NULL DEFAULT 'Civil', materia TEXT, estado TEXT NOT NULL DEFAULT 'EN_TRAMITE', fecha_ingreso TEXT NOT NULL, contraparte TEXT, abogado_responsable TEXT, descripcion TEXT, cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS actuaciones (id TEXT PRIMARY KEY, fecha TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'OTRO', descripcion TEXT NOT NULL, resultado TEXT, causa_id TEXT NOT NULL REFERENCES causas(id) ON DELETE CASCADE, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS plazos (id TEXT PRIMARY KEY, titulo TEXT NOT NULL, fecha TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'OTRO', estado TEXT NOT NULL DEFAULT 'PENDIENTE', notas TEXT, causa_id TEXT NOT NULL REFERENCES causas(id) ON DELETE CASCADE, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS documentos (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'OTRO', descripcion TEXT, archivo TEXT, causa_id TEXT NOT NULL REFERENCES causas(id) ON DELETE CASCADE, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS honorarios (id TEXT PRIMARY KEY, descripcion TEXT NOT NULL, monto REAL NOT NULL, moneda TEXT NOT NULL DEFAULT 'CLP', estado TEXT NOT NULL DEFAULT 'PENDIENTE', tipo TEXT NOT NULL DEFAULT 'HONORARIO', fecha_emision TEXT NOT NULL, fecha_vence TEXT, fecha_pago TEXT, notas TEXT, cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE, causa_id TEXT REFERENCES causas(id), created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
  `)
}

async function main() {
  await initDB()

  // Skip if data already exists
  const existing = await db.select().from(clientes).limit(1)
  if (existing.length > 0) {
    console.log('ℹ️  Base de datos ya tiene datos, omitiendo seed.')
    process.exit(0)
  }

  const now = new Date().toISOString()
  const id1 = nanoid(), id2 = nanoid(), id3 = nanoid()

  await db.insert(clientes).values([
    { id: id1, rut: '12.345.678-9', nombre: 'Juan Carlos Pérez Muñoz', tipo: 'PERSONA_NATURAL', email: 'jcperez@gmail.com', telefono: '22 234 5678', celular: '+56 9 8765 4321', direccion: 'Av. Providencia 1234, Of. 502', ciudad: 'Santiago', region: 'Región Metropolitana', notas: 'Cliente desde 2022. Prefiere comunicación por WhatsApp.', createdAt: now, updatedAt: now },
    { id: id2, rut: '76.543.210-K', nombre: 'Constructora Andina SpA', tipo: 'PERSONA_JURIDICA', email: 'legal@constructoraandina.cl', telefono: '22 456 7890', celular: '+56 9 1234 5678', direccion: 'Av. Apoquindo 4501, Piso 12', ciudad: 'Las Condes', region: 'Región Metropolitana', notas: 'Empresa constructora con múltiples causas laborales.', createdAt: now, updatedAt: now },
    { id: id3, rut: '15.678.901-3', nombre: 'María Isabel Soto Contreras', tipo: 'PERSONA_NATURAL', email: 'msoto@outlook.com', celular: '+56 9 6543 2109', ciudad: 'Viña del Mar', region: 'Región de Valparaíso', createdAt: now, updatedAt: now },
  ])

  const c1 = nanoid(), c2 = nanoid(), c3 = nanoid(), c4 = nanoid()

  await db.insert(causas).values([
    { id: c1, rol: 'C-1234-2023', tribunal: '15° Juzgado Civil de Santiago', tipoCausa: 'Civil', materia: 'Cobro de Pesos', estado: 'EN_TRAMITE', fechaIngreso: '2023-03-15T00:00:00.000Z', contraparte: 'Banco Santander Chile', abogadoResponsable: 'Abg. Carolina López', descripcion: 'Acción de cobro por deudas hipotecarias impugnadas.', clienteId: id1, createdAt: now, updatedAt: now },
    { id: c2, rol: 'RIT O-456-2024', tribunal: '2° Juzgado de Letras del Trabajo de Santiago', tipoCausa: 'Laboral', materia: 'Despido Injustificado', estado: 'EN_TRAMITE', fechaIngreso: '2024-01-10T00:00:00.000Z', contraparte: 'Constructora Andina SpA', abogadoResponsable: 'Abg. Roberto Fuentes', clienteId: id2, createdAt: now, updatedAt: now },
    { id: c3, rol: 'RIT F-789-2023', tribunal: 'Juzgado de Familia de Viña del Mar', tipoCausa: 'Familia', materia: 'Divorcio de Común Acuerdo', estado: 'TERMINADA', fechaIngreso: '2023-06-01T00:00:00.000Z', contraparte: 'Pedro Antonio Rojas Vera', abogadoResponsable: 'Abg. Carolina López', clienteId: id3, createdAt: now, updatedAt: now },
    { id: c4, rol: 'RUC 2300456789-1', tribunal: '7° Juzgado de Garantía de Santiago', tipoCausa: 'Penal', materia: 'Estafa', estado: 'EN_TRAMITE', fechaIngreso: '2023-09-20T00:00:00.000Z', contraparte: 'Ministerio Público', abogadoResponsable: 'Abg. Roberto Fuentes', clienteId: id2, createdAt: now, updatedAt: now },
  ])

  await db.insert(actuaciones).values([
    { id: nanoid(), causaId: c1, fecha: '2023-03-15T00:00:00.000Z', tipo: 'ESCRITO', descripcion: 'Presentación demanda de cobro de pesos.', createdAt: now },
    { id: nanoid(), causaId: c1, fecha: '2023-04-02T00:00:00.000Z', tipo: 'RESOLUCION', descripcion: 'Resolución de admisibilidad. Se admite a tramitación.', resultado: 'Favorable', createdAt: now },
    { id: nanoid(), causaId: c2, fecha: '2024-01-10T00:00:00.000Z', tipo: 'ESCRITO', descripcion: 'Demanda por despido injustificado y cobro de prestaciones.', createdAt: now },
    { id: nanoid(), causaId: c2, fecha: '2024-02-05T00:00:00.000Z', tipo: 'AUDIENCIA', descripcion: 'Audiencia preparatoria. Se fija fecha de juicio.', resultado: 'Se fija juicio para el 15 de mayo de 2024', createdAt: now },
  ])

  const enUnaSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const enDosSemanas = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const enUnMes = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const hace3Dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  await db.insert(plazos).values([
    { id: nanoid(), causaId: c1, titulo: 'Audiencia de conciliación', fecha: enUnaSemana, tipo: 'AUDIENCIA', estado: 'PENDIENTE', notas: 'Sala 3, 10:00 hrs.', createdAt: now, updatedAt: now },
    { id: nanoid(), causaId: c1, titulo: 'Plazo para evacuar traslado', fecha: enDosSemanas, tipo: 'VENCIMIENTO', estado: 'PENDIENTE', notas: 'Responder escrito de la contraparte.', createdAt: now, updatedAt: now },
    { id: nanoid(), causaId: c2, titulo: 'Audiencia de juicio oral', fecha: enUnMes, tipo: 'AUDIENCIA', estado: 'PENDIENTE', notas: 'Preparar testigos: Juan Díaz y Ana Morales.', createdAt: now, updatedAt: now },
    { id: nanoid(), causaId: c2, titulo: 'Presentación lista de testigos', fecha: hace3Dias, tipo: 'PRESENTACION', estado: 'VENCIDO', createdAt: now, updatedAt: now },
    { id: nanoid(), causaId: c4, titulo: 'Audiencia de formalización', fecha: enUnaSemana, tipo: 'AUDIENCIA', estado: 'PENDIENTE', notas: 'Coordinar con cliente para llegar 30 min antes.', createdAt: now, updatedAt: now },
  ])

  await db.insert(documentos).values([
    { id: nanoid(), causaId: c1, nombre: 'Demanda cobro de pesos.pdf', tipo: 'ESCRITO', descripcion: 'Escrito de demanda inicial', createdAt: now },
    { id: nanoid(), causaId: c1, nombre: 'Poder simple cliente Pérez.pdf', tipo: 'PODER', descripcion: 'Poder notarial otorgado por el cliente', createdAt: now },
    { id: nanoid(), causaId: c2, nombre: 'Finiquito impugnado.pdf', tipo: 'CONTRATO', descripcion: 'Finiquito firmado bajo reserva', createdAt: now },
    { id: nanoid(), causaId: c3, nombre: 'Acuerdo divorcio completo.pdf', tipo: 'CONTRATO', descripcion: 'Acuerdo regulatorio de divorcio', createdAt: now },
  ])

  await db.insert(honorarios).values([
    { id: nanoid(), clienteId: id1, causaId: c1, descripcion: 'Honorarios causa C-1234-2023 (cobro de pesos)', monto: 850000, estado: 'PAGADO', tipo: 'HONORARIO', fechaEmision: '2023-03-15T00:00:00.000Z', fechaPago: '2023-03-20T00:00:00.000Z', createdAt: now, updatedAt: now },
    { id: nanoid(), clienteId: id1, causaId: c1, descripcion: 'Segunda cuota honorarios - etapa probatoria', monto: 500000, estado: 'PENDIENTE', tipo: 'HONORARIO', fechaEmision: now, fechaVence: enDosSemanas, createdAt: now, updatedAt: now },
    { id: nanoid(), clienteId: id2, causaId: c2, descripcion: 'Honorarios causa laboral RIT O-456-2024', monto: 1200000, estado: 'PARCIAL', tipo: 'HONORARIO', fechaEmision: '2024-01-10T00:00:00.000Z', notas: 'Pagado 600.000 en enero. Saldo pendiente.', createdAt: now, updatedAt: now },
    { id: nanoid(), clienteId: id2, causaId: c4, descripcion: 'Anticipo causa penal', monto: 500000, estado: 'PAGADO', tipo: 'ANTICIPO', fechaEmision: '2023-09-20T00:00:00.000Z', fechaPago: '2023-09-25T00:00:00.000Z', createdAt: now, updatedAt: now },
    { id: nanoid(), clienteId: id3, causaId: c3, descripcion: 'Honorarios divorcio de común acuerdo', monto: 350000, estado: 'PAGADO', tipo: 'HONORARIO', fechaEmision: '2023-06-01T00:00:00.000Z', fechaPago: '2023-06-05T00:00:00.000Z', createdAt: now, updatedAt: now },
  ])

  console.log('✅ Seed completado')
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
