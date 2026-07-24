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
  fechaPrescripcion: text('fecha_prescripcion'),
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
  archivoUrl: text('archivo_url'),
  archivoNombre: text('archivo_nombre'),
  causaId: text('causa_id').notNull().references(() => causas.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const asesorias = sqliteTable('asesorias', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  clienteId: text('cliente_id').notNull().references(() => clientes.id),
  causaId: text('causa_id').references(() => causas.id),
  fecha: text('fecha').notNull(),
  tipo: text('tipo').notNull().default('Consulta general'),
  descripcion: text('descripcion').notNull(),
  archivoUrl: text('archivo_url'),
  archivoNombre: text('archivo_nombre'),
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

export const cuotasHonorario = sqliteTable('cuotas_honorario', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  honorarioId: text('honorario_id').notNull().references(() => honorarios.id),
  monto: real('monto').notNull(),
  fechaPago: text('fecha_pago').notNull(),
  tareaId: text('tarea_id'),
  pagada: integer('pagada').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
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

export const gestionesTarea = sqliteTable('gestiones_tarea', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  tareaId: text('tarea_id').notNull().references(() => tareas.id),
  fecha: text('fecha').notNull(),
  descripcion: text('descripcion').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
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
  recordatorio1hEnviado: integer('recordatorio_1h_enviado').notNull().default(0),
  recordatorio30minEnviado: integer('recordatorio_30min_enviado').notNull().default(0),
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

export const perfilAbogado = sqliteTable('perfil_abogado', {
  userId: text('user_id').primaryKey(),
  email: text('email'),
  whatsapp: text('whatsapp'),
  banco: text('banco'),
  tipoCuenta: text('tipo_cuenta'),
  numeroCuenta: text('numero_cuenta'),
  titularNombre: text('titular_nombre'),
  titularRut: text('titular_rut'),
  perfilCompleto: integer('perfil_completo').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const solicitudesAcceso = sqliteTable('solicitudes_acceso', {
  email: text('email').primaryKey(),
  intentos: integer('intentos').notNull().default(1),
  ultimoAviso: text('ultimo_aviso'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const registrosAuditoria = sqliteTable('registros_auditoria', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  accion: text('accion').notNull(),
  entidad: text('entidad').notNull(),
  entidadId: text('entidad_id'),
  detalle: text('detalle'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

// Cuentas de acceso — fuente de verdad del sistema de pruebas (Fase 1).
// Tabla NUEVA y aditiva: no afecta a los usuarios actuales, que siguen
// entrando por ALLOWED_EMAILS/PLAN_PRO_EMAILS. El estado se refleja además en
// el metadata de Clerk para que el middleware lo lea sin consultar la base.
// estado: 'trial' | 'activo' | 'bloqueado' | 'suspendido'
// plan:   'pro' | 'basico'
export const cuentas = sqliteTable('cuentas', {
  userId: text('user_id').primaryKey(),
  email: text('email'),
  nombre: text('nombre'),
  rut: text('rut'),
  plan: text('plan').notNull().default('pro'),
  estado: text('estado').notNull().default('trial'),
  trialInicio: text('trial_inicio'),
  trialFin: text('trial_fin'),
  recordatorioVencimiento: integer('recordatorio_vencimiento').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// Conteo diario de usos de IA, para topar las pruebas (una fila por usuario y día).
export const usoIa = sqliteTable('uso_ia', {
  id: text('id').primaryKey(), // `${userId}:${fecha}`
  userId: text('user_id').notNull(),
  fecha: text('fecha').notNull(),
  conteo: integer('conteo').notNull().default(0),
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
export type PerfilAbogado = typeof perfilAbogado.$inferSelect
export type RegistroAuditoria = typeof registrosAuditoria.$inferSelect
