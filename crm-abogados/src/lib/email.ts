import { Resend } from 'resend'

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
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://dotfiles-iota.vercel.app'}/dashboard"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Abrir LexCRM
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
        LexCRM · Gestión Legal ·
        <a href="mailto:emaferna.contacto@gmail.com" style="color:#94a3b8;">emaferna.contacto@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>`
}
