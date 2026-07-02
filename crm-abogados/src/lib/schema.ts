import { sql } from 'drizzle-orm'
import { text, integer, real, sqliteTable } from 'drizzle-orm/sqlite-core'

export const clientes = sqliteTable('clientes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  rut: text('rut').notNull().unique(),
  nombre: text('nombre').notNull(),
  tipo: text('tipo').notNull().default('PERSONA_NATURAL'),
  email: text('email'),
  telefono: text('telefono'),
  celular: text('celular'),
  direccion: text('direccion'),
  ciudad: text('ciudad').default('Santiago'),
  region: text('region').default('Región Metropolitana'),
  notas: text('notas'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const causas = sqliteTable('causas', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  rol: text('rol').notNull(),
  tribunal: text('tribunal').notNull(),
  tipoCausa: text('tipo_causa').notNull().default('Civil'),
  materia: text('materia'),
  estado: text('estado').notNull().default('EN_TRAMITE'),
  fechaIngreso: text('fecha_ingreso').notNull(),
  contraparte: text('contraparte'),
  abogadoResponsable: text('abogado_responsable'),
  descripcion: text('descripcion'),
  clienteId: text('cliente_id').notNull().references(() => clientes.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const actuaciones = sqliteTable('actuaciones', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  fecha: text('fecha').notNull(),
  tipo: text('tipo').notNull().default('OTRO'),
  descripcion: text('descripcion').notNull(),
  resultado: text('resultado'),
  compromiso: text('compromiso'),
  fechaRecordatorio: text('fecha_recordatorio'),
  recordatorioEnviado: integer('recordatorio_enviado').notNull().default(0),
  causaId: text('causa_id').notNull().references(() => causas.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const plazos = sqliteTable('plazos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  titulo: text('titulo').notNull(),
  fecha: text('fecha').notNull(),
  tipo: text('tipo').notNull().default('OTRO'),
  estado: text('estado').notNull().default('PENDIENTE'),
  notas: text('notas'),
  causaId: text('causa_id').notNull().references(() => causas.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const documentos = sqliteTable('documentos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  nombre: text('nombre').notNull(),
  tipo: text('tipo').notNull().default('OTRO'),
  descripcion: text('descripcion'),
  archivo: text('archivo'),
  causaId: text('causa_id').notNull().references(() => causas.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const honorarios = sqliteTable('honorarios', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  descripcion: text('descripcion').notNull(),
  monto: real('monto').notNull(),
  moneda: text('moneda').notNull().default('CLP'),
  estado: text('estado').notNull().default('PENDIENTE'),
  tipo: text('tipo').notNull().default('HONORARIO'),
  fechaEmision: text('fecha_emision').notNull(),
  fechaVence: text('fecha_vence'),
  fechaPago: text('fecha_pago'),
  notas: text('notas'),
  clienteId: text('cliente_id').notNull().references(() => clientes.id),
  causaId: text('causa_id').references(() => causas.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const tareas = sqliteTable('tareas', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion'),
  estado: text('estado').notNull().default('PENDIENTE'),
  prioridad: text('prioridad').notNull().default('MEDIA'),
  fechaVencimiento: text('fecha_vencimiento'),
  asignadoA: text('asignado_a'),
  asignadoEmail: text('asignado_email'),
  esDerivada: integer('es_derivada').notNull().default(0),
  credencialesPortal: text('credenciales_portal'),
  notas: text('notas'),
  clienteId: text('cliente_id').references(() => clientes.id),
  causaId: text('causa_id').references(() => causas.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const citas = sqliteTable('citas', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion'),
  clienteId: text('cliente_id').references(() => clientes.id),
  prospectoId: text('prospecto_id').references(() => prospectos.id),
  causaId: text('causa_id').references(() => causas.id),
  fecha: text('fecha').notNull(),
  horaInicio: text('hora_inicio').notNull(),
  horaFin: text('hora_fin'),
  tipo: text('tipo').notNull().default('PRESENCIAL'),
  linkReunion: text('link_reunion'),
  esGratuita: integer('es_gratuita').notNull().default(0),
  valor: real('valor'),
  estado: text('estado').notNull().default('PENDIENTE'),
  notas: text('notas'),
  recordatorioCitaEnviado: integer('recordatorio_cita_enviado').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const prospectos = sqliteTable('prospectos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  nombre: text('nombre').notNull(),
  empresa: text('empresa'),
  email: text('email'),
  telefono: text('telefono'),
  origen: text('origen').default('REFERIDO'),
  etapa: text('etapa').notNull().default('CONTACTO'),
  valorEstimado: real('valor_estimado'),
  notas: text('notas'),
  fechaContacto: text('fecha_contacto').notNull(),
  proximoContacto: text('proximo_contacto'),
  clienteId: text('cliente_id').references(() => clientes.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export type Cliente = typeof clientes.$inferSelect
export type NuevoCliente = typeof clientes.$inferInsert
export type Causa = typeof causas.$inferSelect
export type NuevaCausa = typeof causas.$inferInsert
export type Plazo = typeof plazos.$inferSelect
export type Honorario = typeof honorarios.$inferSelect
export type Documento = typeof documentos.$inferSelect
export type Actuacion = typeof actuaciones.$inferSelect
export type Tarea = typeof tareas.$inferSelect
export type NuevaTarea = typeof tareas.$inferInsert
export type Cita = typeof citas.$inferSelect
export type NuevaCita = typeof citas.$inferInsert
export type Prospecto = typeof prospectos.$inferSelect
export type NuevoProspecto = typeof prospectos.$inferInsert
