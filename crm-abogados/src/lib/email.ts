import { Resend } from 'resend'
import { formatFechaCorta } from './utils'

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

interface CitaItem {
  titulo: string
  horaInicio: string
  cliente?: string | null
}

interface PlazoItem {
  titulo: string
  fecha: string
  rol?: string | null
}

interface TareaItem {
  titulo: string
  fecha: string
}

interface HonorarioItem {
  descripcion: string
  monto: string
  cliente?: string | null
  fechaVence: string
}

export function buildCitaConfirmationEmail({
  contactoNombre,
  abogadoNombre,
  titulo,
  fecha,
  horaInicio,
  horaFin,
  tipoLabel,
  linkReunion,
}: {
  contactoNombre: string
  abogadoNombre: string
  titulo: string
  fecha: string
  horaInicio: string
  horaFin?: string | null
  tipoLabel: string
  linkReunion?: string | null
}): string {
  const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#14254c,#1a3060);padding:28px 32px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:22px;font-weight:800;color:#fff;">Lex<span style="color:#60a5fa;">CRM</span></span>
      </div>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Confirmación de cita</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">
        Hola ${contactoNombre}, tu cita con ${abogadoNombre} ha sido agendada:
      </p>

      <div style="background:#f8fafc;border-radius:8px;padding:18px 20px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#14254c;">${titulo}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#334155;text-transform:capitalize;">📅 ${fechaFormateada}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#334155;">🕐 ${horaInicio}${horaFin ? ` – ${horaFin}` : ''}</p>
        <p style="margin:0;font-size:14px;color:#334155;">📍 ${tipoLabel}</p>
      </div>

      ${linkReunion ? `
      <div style="margin-bottom:20px;text-align:center;">
        <a href="${linkReunion}"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Unirse a la reunión
        </a>
        <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;word-break:break-all;">${linkReunion}</p>
      </div>` : ''}

      <p style="margin:0;font-size:13px;color:#64748b;">
        Si necesitas reagendar o cancelar, por favor contáctanos respondiendo este correo.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
        LexCRM · Gestión Legal ·
        <a href="mailto:contacto@lexcrm.site" style="color:#94a3b8;">contacto@lexcrm.site</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

interface CitaReminderItem {
  titulo: string
  horaInicio: string
  horaFin?: string | null
  tipo: string
  contacto?: string | null
  linkReunion?: string | null
}

const TIPO_LABEL: Record<string, string> = {
  PRESENCIAL: '📍 Presencial',
  MEET: '📹 Google Meet',
  ZOOM: '📹 Zoom',
  TELEFONICA: '📞 Telefónica',
}

export function buildCitaReminderEmail({
  userName,
  fechaMañana,
  citas,
}: {
  userName: string
  fechaMañana: string
  citas: CitaReminderItem[]
}): string {
  const fechaFormateada = new Date(fechaMañana + 'T00:00:00').toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const citasHtml = citas.map(c => `
    <div style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
      <div style="font-weight:700;font-size:15px;color:#14254c;margin-bottom:4px;">${c.titulo}</div>
      <div style="font-size:13px;color:#334155;margin-bottom:2px;">
        🕐 <strong>${c.horaInicio}${c.horaFin ? ` – ${c.horaFin}` : ''}</strong>
        &nbsp;&nbsp;${TIPO_LABEL[c.tipo] ?? c.tipo}
      </div>
      ${c.contacto ? `<div style="font-size:13px;color:#64748b;">👤 ${c.contacto}</div>` : ''}
      ${c.linkReunion ? `
        <div style="margin-top:8px;">
          <a href="${c.linkReunion}"
             style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:6px 16px;border-radius:6px;font-size:12px;font-weight:600;">
            Unirse a la reunión
          </a>
        </div>` : ''}
    </div>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#14254c,#1a3060);padding:28px 32px;">
      <span style="font-size:22px;font-weight:800;color:#fff;">Lex<span style="color:#60a5fa;">CRM</span></span>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Recordatorio de citas para mañana</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px 16px;">
      <p style="margin:0 0 4px;font-size:15px;color:#334155;">
        Hola <strong>${userName}</strong>, tienes <strong>${citas.length} ${citas.length === 1 ? 'cita' : 'citas'}</strong> programadas para:
      </p>
      <p style="margin:0 0 20px;font-size:17px;font-weight:700;color:#14254c;text-transform:capitalize;">
        📅 ${fechaFormateada}
      </p>

      <div style="background:#f8fafc;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        ${citasHtml}
      </div>

      <div style="margin-top:24px;text-align:center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.lexcrm.site'}/citas"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Ver agenda en LexCRM
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;margin-top:16px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
        LexCRM · Gestión Legal ·
        <a href="mailto:contacto@lexcrm.site" style="color:#94a3b8;">contacto@lexcrm.site</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

interface TareaPendienteItem {
  titulo: string
  fechaVencimiento?: string | null
  prioridad?: string | null
}

export function buildTareasPendientesEmail({
  userName,
  tareas,
}: {
  userName: string
  tareas: TareaPendienteItem[]
}): string {
  const tareasHtml = tareas.slice(0, 10).map(t => `
    <div style="padding:12px 18px;border-bottom:1px solid #e2e8f0;">
      <div style="font-weight:600;font-size:14px;color:#1e293b;">${t.titulo}</div>
      ${t.fechaVencimiento ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">📅 Vence ${formatFechaCorta(t.fechaVencimiento)}</div>` : ''}
    </div>`).join('')

  const restantes = tareas.length > 10
    ? `<p style="margin:12px 0 0;font-size:12px;color:#94a3b8;text-align:center;">…y ${tareas.length - 10} más</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#14254c,#1a3060);padding:28px 32px;">
      <span style="font-size:22px;font-weight:800;color:#fff;">Lex<span style="color:#60a5fa;">CRM</span></span>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Tareas pendientes</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px 16px;">
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">
        Hola <strong>${userName}</strong>, tienes <strong>${tareas.length} ${tareas.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}</strong>:
      </p>

      <div style="background:#f8fafc;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        ${tareasHtml}
      </div>
      ${restantes}

      <div style="margin-top:24px;text-align:center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.lexcrm.site'}/tareas"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Ver tareas en LexCRM
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;margin-top:16px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
        LexCRM · Gestión Legal ·
        <a href="mailto:contacto@lexcrm.site" style="color:#94a3b8;">contacto@lexcrm.site</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export function buildNotificationEmail({
  userName,
  citasHoy,
  citasMañana,
  plazosProximos,
  tareasProximas,
  honorariosVencidos = [],
}: {
  userName: string
  citasHoy: CitaItem[]
  citasMañana: CitaItem[]
  plazosProximos: PlazoItem[]
  tareasProximas: TareaItem[]
  honorariosVencidos?: HonorarioItem[]
}): string {
  const section = (titulo: string, color: string, items: string[]) =>
    items.length === 0 ? '' : `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${color};">${titulo}</h3>
        <div style="background:#f8fafc;border-radius:8px;overflow:hidden;">
          ${items.map(i => `<div style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${i}</div>`).join('')}
        </div>
      </div>`

  const citasHoyHtml = citasHoy.map(c => `🕐 <strong>${c.horaInicio}</strong> — ${c.titulo}${c.cliente ? ` <span style="color:#64748b;">(${c.cliente})</span>` : ''}`)
  const citasMañanaHtml = citasMañana.map(c => `🕐 <strong>${c.horaInicio}</strong> — ${c.titulo}${c.cliente ? ` <span style="color:#64748b;">(${c.cliente})</span>` : ''}`)
  const plazosHtml = plazosProximos.map(p => `📅 <strong>${p.fecha}</strong> — ${p.titulo}${p.rol ? ` <span style="color:#64748b;">[${p.rol}]</span>` : ''}`)
  const tareasHtml = tareasProximas.map(t => `✅ <strong>${t.fecha}</strong> — ${t.titulo}`)
  const honorariosHtml = honorariosVencidos.map(h => `💸 <strong>${h.monto}</strong> — ${h.descripcion}${h.cliente ? ` <span style="color:#64748b;">(${h.cliente})</span>` : ''} · vencido el ${h.fechaVence}`)

  const totalItems = citasHoy.length + citasMañana.length + plazosProximos.length + tareasProximas.length + honorariosVencidos.length

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#14254c,#1a3060);padding:28px 32px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:22px;font-weight:800;color:#fff;">Lex<span style="color:#60a5fa;">CRM</span></span>
      </div>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Resumen diario para ${userName}</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">
        Tienes <strong>${totalItems} ${totalItems === 1 ? 'ítem' : 'ítems'}</strong> para revisar hoy:
      </p>

      ${section('Citas de hoy', '#2563eb', citasHoyHtml)}
      ${section('Citas de mañana', '#7c3aed', citasMañanaHtml)}
      ${section('Plazos próximos', '#dc2626', plazosHtml)}
      ${section('Tareas próximas', '#d97706', tareasHtml)}
      ${section('Honorarios vencidos sin pagar', '#b91c1c', honorariosHtml)}

      <div style="margin-top:24px;text-align:center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.lexcrm.site'}/dashboard"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Abrir LexCRM
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
        LexCRM · Gestión Legal ·
        <a href="mailto:contacto@lexcrm.site" style="color:#94a3b8;">contacto@lexcrm.site</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export function buildSolicitudAccesoEmail({
  email,
  intentos,
}: {
  email: string
  intentos: number
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#14254c,#1a3060);padding:28px 32px;">
      <span style="font-size:22px;font-weight:800;color:#fff;">Lex<span style="color:#60a5fa;">CRM</span></span>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Solicitud de acceso</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">
        Alguien intentó iniciar sesión en LexCRM y todavía no está autorizado:
      </p>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:18px 20px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#92400e;">${email}</p>
        <p style="margin:0;font-size:13px;color:#b45309;">
          ${intentos === 1 ? 'Primer intento de acceso' : `${intentos} intentos de acceso`}
        </p>
      </div>

      <p style="margin:0 0 20px;font-size:13px;color:#64748b;">
        Si decides autorizarlo, agrega este correo a la variable <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">ALLOWED_EMAILS</code> en Vercel y vuelve a desplegar.
      </p>

      <p style="margin:0;font-size:12px;color:#94a3b8;">
        No vas a recibir otro aviso por este mismo correo hasta dentro de 24 horas.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
        LexCRM · Gestión Legal ·
        <a href="mailto:contacto@lexcrm.site" style="color:#94a3b8;">contacto@lexcrm.site</a>
      </p>
    </div>
  </div>
</body>
</html>`
}
