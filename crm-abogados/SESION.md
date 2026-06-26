# Estado de la sesión — LexCRM

> Documento para retomar el trabajo en un próximo chat.
> Última actualización: 2026-06-26 (tarde)

---

## 📍 Dónde estamos

LexCRM (CRM para abogados en Chile) está en evolución hacia producto SaaS comercializable.
Todo el trabajo está en la rama **`claude/crm-chilean-lawyers-wnk6t5`** (pusheada a GitHub) y se
despliega automáticamente en **Vercel**.

### Stack
- Next.js 14 (App Router) · Drizzle ORM + Turso (SQLite/HTTP)
- Clerk v5.7.6 (auth + multi-tenant por `userId`)
- Tailwind CSS · sonner (toasts) · lucide-react (iconos)
- IA: Anthropic Messages API (proveedor intercambiable)
- Marca: logo SVG (`LogoMark.tsx` + `public/logo.svg`), paleta `blue` de Tailwind
  redefinida con los azules del logo (royal #2563eb → navy #14254c).

---

## ✅ Completado

### Base (sesiones previas)
- Autenticación con Clerk (login/logout, rutas protegidas).
- Multi-tenancy: `userId` en las 8 tablas, todas las queries filtradas.
- Botón "Cerrar sesión" en el sidebar.

### Fase 1 — Quick wins
- Dashboard: banner de vencimientos + barra de accesos rápidos.
- Sidebar: badges semáforo (🔴 vencidos / 🟡 por vencer / 🔵 citas de hoy).
- `EmptyState` reutilizable (clientes, causas, dashboard).
- Toasts con `sonner` reemplazando todos los `alert()`.

### Fase 2 — UX profesional
- Búsqueda global ⌘K (`/api/search` + `GlobalSearch.tsx`), barra superior sticky.
- Skeleton loading (`Skeleton.tsx` + `loading.tsx` en 8 rutas).
- Dashboard financiero: KPI tasa de cobro + gráfico de barras emitido/cobrado (6 meses).

### Fase 3 (parcial) — Módulo de IA
- Arquitectura `AIProvider` intercambiable (`src/lib/ai/`).
- Resumen de causa + borrador de escritos (`/api/ai/resumen`, `/api/ai/borrador`).
- `AIPanel.tsx` integrado en el detalle de causa.

### Fase 3 — Seguridad de acceso ✅
- `clerkMiddleware` (API v5) reemplaza el deprecated `authMiddleware`.
- Lista blanca de emails: variable `ALLOWED_EMAILS` en Vercel (separados por coma).
- Email leído desde JWT session claims (requiere paso en Clerk Dashboard — ver "Pendiente AHORA").
- Rutas API retornan `403 JSON` si el email no está permitido; páginas redirigen a `/no-autorizado`.
- Página `/no-autorizado` con botón "Cerrar sesión" (ruta pública, fuera del layout del dashboard).

### Fase 3 — Embudo comercial ✅
- Tabla `prospectos` (`schema.ts` + `initDB`) con etapas, valor estimado y origen.
- CRUD completo: `/api/prospectos` (GET/POST) y `/api/prospectos/[id]` (GET/PATCH/DELETE).
- Tablero kanban (`KanbanBoard.tsx`): 5 etapas (Contacto → Reunión → Propuesta → Ganado / Perdido),
  mover entre etapas con flechas, marcar perdido / reactivar, editar y eliminar.
- Página `/embudo` con KPIs (pipeline activo, valor estimado, ganados, tasa de conversión).
- Formularios `/embudo/nuevo` y `/embudo/[id]/editar`. Skeleton en `loading.tsx`.
- Item "Embudo" agregado al sidebar.
- **Conversión prospecto → cliente**: botón en tarjetas "Ganado" → `/embudo/[id]/convertir`
  (formulario precargado, pide RUT) → `/api/prospectos/[id]/convertir` crea el cliente y
  vincula `prospectos.clienteId`. Si ya está convertido, muestra "Ver cliente".
- **Recordatorios de seguimiento**: campo `proximoContacto` por prospecto. Badge semáforo
  en el sidebar (🔴 vencido / 🟡 ≤3 días), indicador con campana en cada tarjeta y banner
  de "seguimientos pendientes" en la página del embudo.

---

## ⏳ Pendiente AHORA (acciones del usuario)

### A) Activar restricción de acceso (3 pasos obligatorios)

**1. Clerk Dashboard → Configure → Sessions → "Customize session token"**
Agregar al JSON del token:
```json
{ "email": "{{user.primary_email_address}}" }
```

**2. Vercel → Settings → Environment Variables**

| Key | Valor |
|---|---|
| `ALLOWED_EMAILS` | `emafernacoach@gmail.com` (coma para varios) |

**3. Vercel → Deployments → Redeploy**

**Opcional pero recomendado:** Clerk Dashboard → User & Authentication → Restrictions → activar **Allowlist** → agregar tu email. Esto impide que cualquiera se registre.

---

### B) Activar la IA

| Key | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (de console.anthropic.com) |
| `AI_MODEL` *(opcional)* | `claude-sonnet-4-6` |

Luego Redeploy. Probar en cualquier causa → panel "Asistente IA".

> Sin la key, el módulo muestra "La IA no está configurada" y el resto de la app funciona normal.

---

## 🔜 Próximos pasos

1. **Dark mode** — toggle en el sidebar, persistido (localStorage / clase en `<html>`). Quick win visual.
2. **Reportes / métricas comerciales** — embudo por mes, valor ganado vs perdido, tiempo promedio de cierre.

---

## 🗂️ Archivos clave (para ubicarse rápido)

| Área | Ruta |
|---|---|
| Esquema BD | `src/lib/schema.ts` |
| Auth helpers | `src/lib/auth.ts` (`requireUserId`, `getUserId`) |
| Middleware de acceso | `src/middleware.ts` (allowlist por email) |
| Página no autorizado | `src/app/no-autorizado/page.tsx` |
| Módulo IA | `src/lib/ai/` (provider, anthropic, prompts, index, causa-context) |
| Búsqueda | `src/app/api/search/route.ts` · `src/components/GlobalSearch.tsx` |
| Dashboard | `src/app/(dashboard)/dashboard/page.tsx` |
| Layout + semáforo | `src/app/(dashboard)/layout.tsx` |
| Documentación técnica completa | `HISTORIAL.md` |

---

## ▶️ Cómo retomar en otro chat

1. Abrir el repo en la rama `claude/crm-chilean-lawyers-wnk6t5`.
2. Leer `SESION.md` (este archivo) y `HISTORIAL.md`.
3. Continuar con "Próximos pasos" o lo que el usuario indique.
