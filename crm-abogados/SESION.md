# Estado de la sesión — LexCRM

> Documento para retomar el trabajo en un próximo chat.
> Última actualización: 2026-06-26

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

---

## ⏳ Pendiente AHORA (acción del usuario)

**Activar la IA** agregando la API key en Vercel → Settings → Environment Variables:

| Key | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (de console.anthropic.com, requiere saldo) |
| `AI_MODEL` *(opcional)* | `claude-sonnet-4-6` |

Luego **Redeploy**. Probar en cualquier causa → panel "Asistente IA" → "Generar resumen".

> Sin la key, el módulo muestra "La IA no está configurada" y el resto de la app funciona normal.

### Mensajes de error del panel (diagnóstico rápido)
- *"La IA no está configurada"* → falta la variable o el redeploy.
- *"La API key de IA es inválida"* → key mal copiada.
- *"Límite de uso alcanzado"* → sin saldo en Anthropic Billing.

---

## 🔜 Próximos pasos (Fase 3 restante)

1. **Módulo de embudo comercial** — pipeline de prospectos → clientes (estados: contacto,
   reunión, propuesta, ganado/perdido). Tablero tipo kanban o lista por etapa.
2. **Dark mode** — toggle en el sidebar, persistido (localStorage / clase en `<html>`).

Recomendación: el **embudo comercial** aporta más valor comercial; el **dark mode** es un
quick win visual.

---

## 🗂️ Archivos clave (para ubicarse rápido)

| Área | Ruta |
|---|---|
| Esquema BD | `src/lib/schema.ts` |
| Auth helpers | `src/lib/auth.ts` (`requireUserId`, `getUserId`) |
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
