# LexCRM — Historial de desarrollo

CRM para abogados chilenos. Desplegado en Vercel (`dotfiles-iota.vercel.app`).  
Repositorio: `Emmanuel-777/dotfiles` · rama: `master`

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 App Router (server + client components) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS + clases custom (`.card`, `.badge`, `.btn-primary`, etc.) |
| ORM | Drizzle ORM |
| Base de datos | Turso (SQLite en la nube vía HTTP) |
| ID generation | `nanoid` (`src/lib/nanoid.ts`) |
| Iconos | Lucide React |
| Deploy | Vercel (Node.js 20) |

### Notas críticas de infraestructura

- `initDB()` usa llamadas individuales `client.execute()` dentro de un loop (NO `executeMultiple` — causa errores con el cliente HTTP).
- URL de Turso: `replace('libsql://', 'https://')` para modo HTTP.
- Migraciones de columnas nuevas: `try/catch` con `ALTER TABLE ADD COLUMN` (SQLite no soporta `IF NOT EXISTS` en columnas).
- Todas las páginas de datos usan `export const dynamic = 'force-dynamic'`.
- Después de mutaciones en cliente: `router.refresh()` para re-renderizar server components.

---

## Módulos implementados

### 1. Clientes (`/clientes`)

- Listado con buscador, badge de causa activa
- Botón **"Ver carpeta"** (antes "Ver ficha") → abre ficha del cliente
- Formulario nuevo/editar cliente: nombre, RUT, email, celular, dirección, notas
- Página de detalle `/clientes/[id]`: datos + causas asociadas + botón **Reporte**

### 2. Causas (`/causas`)

- Listado con estado y filtro
- Formulario nuevo/editar: ROL, tipo de causa, tribunal (con listado de todos los tribunales de Chile por región), abogado responsable, contraparte, juez, estado
- Página de detalle `/causas/[id]` con secciones:
  - Datos de la causa
  - **Gestiones / Actuaciones** (timeline cronológico)
  - **Plazos** (con alerta visual de vencimiento)
  - **Tareas** activas con código de color
  - **Honorarios**
  - **Documentos**

### 3. Gestiones / Actuaciones (`/causas/[id]/actuacion`)

Registro de cada acción legal realizada por el abogado.

**Campos:**
- Fecha
- Tipo de gestión (lista predefinida: Audiencia, Presentación de escrito, Llamada con cliente, etc.)
- Descripción (obligatoria)
- Resultado / Observaciones

**Compromiso del cliente (opcional):**
- Checkbox "El cliente quedó con un compromiso — enviar recordatorio"
- Si se activa: campo de texto con el compromiso + fecha del recordatorio
- Al guardar se almacenan `compromiso`, `fechaRecordatorio` y `recordatorioEnviado = 0`

**Botones de recordatorio (en vista de causa):**  
Cuando una actuación tiene compromiso registrado, aparece una caja amber con:
- Texto del compromiso + fecha límite
- Botón **WhatsApp** (link `wa.me` con mensaje pre-redactado)
- Botón **Email** (link `mailto:` con asunto y cuerpo pre-redactados)
- Botón "Marcar como enviado" (actualiza `recordatorioEnviado = 1`)

El mensaje pre-redactado incluye: nombre del cliente, ROL de la causa, texto del compromiso, fecha límite y nombre del abogado.

**Formato teléfono chileno:**
```
9XXXXXXXX → 569XXXXXXXX
8XXXXXXXX → 5698XXXXXXXX
56XXXXXXXXX → sin cambio
```

### 4. Tareas (`/tareas`)

- Listado global con código de colores por urgencia
- Tareas por causa: con fecha de vencimiento, prioridad (ALTA / MEDIA / BAJA), estado inline
- Derivación a terceros: campo "Asignado a" con icono especial
- Estados: PENDIENTE, EN_PROGRESO, COMPLETADA, CANCELADA
- `TareaEstadoSelect`: cambio de estado inline sin recargar página

**Código de colores urgencia:**
| Color | Significado |
|---|---|
| Verde | A tiempo |
| Amarillo | ≤ 48 horas |
| Rojo | Vencida o vence hoy |

### 5. Plazos / Agenda (`/agenda`)

- Listado de plazos con alerta visual (rojo = vencido, amber = crítico)
- Formulario nuevo plazo: título, causa, fecha, descripción

### 6. Citas (`/citas`)

Panel de agendamiento de consultas y reuniones.

**Campos:**
- Título, descripción
- Cliente + Causa (causa filtra por cliente seleccionado)
- Fecha + Hora inicio / fin
- **Modalidad:** Presencial / Meet / Zoom / Telefónica
  - Si Meet o Zoom: campo para el link de reunión
- **Cobro:** toggle Gratuita / Con valor
- Estado: PENDIENTE, CONFIRMADA, COMPLETADA, CANCELADA
- Notas

**Vista de detalle:**
- Botón **"Agregar a Google Calendar"** (deep link sin OAuth):  
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=.../...`
- `CitaEstadoSelect`: cambio de estado inline

### 7. Honorarios (`/honorarios`)

- Listado con total pendiente/parcial destacado
- Formulario: causa, monto, descripción, estado (PENDIENTE, PARCIAL, PAGADO)

### 8. Documentos (`/documentos`)

- Listado de documentos por causa
- Formulario: nombre, causa, tipo, notas

### 9. Dashboard (`/dashboard`)

**Tarjetas de resumen (5):**
1. Clientes activos
2. Causas en trámite (de N totales)
3. Tareas activas
4. Plazos próximos
5. Honorarios por cobrar

**Widgets (3 columnas):**
- **Próximos plazos**: ordenados por fecha, con alerta visual
- **Causas recientes**: últimas 5 con estado
- **Tareas activas**: código de color + leyenda mini

**Widget de recordatorios pendientes:**  
Aparece automáticamente cuando hay compromisos con `fechaRecordatorio <= hoy` y `recordatorioEnviado = 0`. Muestra cliente, ROL, texto del compromiso y botones de acción directa.

### 10. Reporte por cliente (`/clientes/[id]/reporte`)

Informe profesional "Informe de Gestiones" imprimible, pensado para entregar al cliente.

**Contenido por causa:**
- Encabezado con ROL, tipo, tribunal, estado y abogado responsable
- Timeline de gestiones (actuaciones) con badge de tipo y resultado
- Plazos próximos (fondo amber)
- Tareas activas con prioridad / Tareas completadas (texto tachado)
- Honorarios asociados

**Print:**
- Sidebar oculto al imprimir (`print:hidden` en `<aside>`)
- Margen izquierdo eliminado en `<main>` (`print:ml-0`)
- `page-break` entre causas para impresión multi-página

---

## Estructura de archivos relevantes

```
crm-abogados/src/
├── lib/
│   ├── schema.ts          # Tablas Drizzle: clientes, causas, plazos, honorarios, tareas, actuaciones, citas
│   ├── db.ts              # initDB() + cliente Turso + migraciones
│   ├── utils.ts           # formatMonto, formatFechaCorta, formatFechaRelativa, estaVencido, esCritico, urgenciaTarea, URGENCIA_CLASES, ESTADOS_*
│   └── nanoid.ts          # Generador de IDs
├── components/
│   ├── Sidebar.tsx        # Nav principal (print:hidden)
│   ├── ReminderButtons.tsx # Botones WhatsApp/Email para compromisos
│   ├── TareaEstadoSelect.tsx
│   └── CitaEstadoSelect.tsx
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx     # print:ml-0
│   │   ├── dashboard/page.tsx
│   │   ├── clientes/
│   │   │   ├── page.tsx
│   │   │   ├── nuevo/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── editar/page.tsx
│   │   │       ├── reporte/page.tsx
│   │   │       └── caratula/page.tsx
│   │   ├── causas/
│   │   │   ├── page.tsx
│   │   │   ├── nueva/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── editar/page.tsx
│   │   │       ├── actuacion/page.tsx
│   │   │       └── tareas/nueva/page.tsx
│   │   ├── citas/
│   │   │   ├── page.tsx
│   │   │   ├── nueva/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── editar/page.tsx
│   │   ├── agenda/
│   │   ├── tareas/
│   │   ├── honorarios/
│   │   └── documentos/
│   └── api/
│       ├── actuaciones/route.ts
│       ├── actuaciones/[id]/route.ts
│       ├── causas/route.ts
│       ├── causas/[id]/route.ts
│       ├── citas/route.ts
│       ├── citas/[id]/route.ts
│       ├── clientes/route.ts
│       ├── clientes/[id]/route.ts
│       ├── plazos/route.ts
│       ├── honorarios/route.ts
│       ├── tareas/route.ts
│       ├── tareas/[id]/route.ts
│       └── documentos/route.ts
```

---

## Schema de base de datos

### `clientes`
| Campo | Tipo | Notas |
|---|---|---|
| id | text PK | nanoid |
| nombre | text | obligatorio |
| rut | text | |
| email | text | |
| celular | text | formato `9XXXXXXXX` |
| direccion | text | |
| notas | text | |
| createdAt | text | CURRENT_TIMESTAMP |

### `causas`
| Campo | Tipo |
|---|---|
| id | text PK |
| rol | text |
| tipoCausa | text |
| tribunal | text |
| estado | text | EN_TRAMITE / TERMINADA / ARCHIVADA / SUSPENDIDA |
| clienteId | text FK → clientes |
| abogadoResponsable | text |
| contraparte | text |
| juez | text |
| descripcion | text |
| createdAt | text |

### `actuaciones`
| Campo | Tipo | Notas |
|---|---|---|
| id | text PK | |
| fecha | text | |
| tipo | text | |
| descripcion | text | |
| resultado | text | |
| compromiso | text | null si no hay compromiso |
| fechaRecordatorio | text | fecha ISO `YYYY-MM-DD` |
| recordatorioEnviado | integer | 0 / 1 |
| causaId | text FK → causas | |
| createdAt | text | |

### `citas`
| Campo | Tipo | Notas |
|---|---|---|
| id | text PK | |
| titulo | text | |
| descripcion | text | |
| clienteId | text FK → clientes | |
| causaId | text FK → causas | |
| fecha | text | `YYYY-MM-DD` |
| horaInicio | text | `HH:MM` |
| horaFin | text | |
| tipo | text | PRESENCIAL / MEET / ZOOM / TELEFONICA |
| linkReunion | text | |
| esGratuita | integer | 0 / 1 |
| valor | real | |
| estado | text | PENDIENTE / CONFIRMADA / COMPLETADA / CANCELADA |
| notas | text | |
| createdAt | text | |
| updatedAt | text | |

### `plazos`, `tareas`, `honorarios`, `documentos`
Tablas estándar con FK a causas. Ver `src/lib/schema.ts` para detalle completo.

---

## Links de utilidad

- **Google Calendar deep link:**  
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=TITULO&dates=YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS&details=DESCRIPCION`

- **WhatsApp deep link:**  
  `https://wa.me/56XXXXXXXXX?text=MENSAJE_CODIFICADO`

- **Email deep link:**  
  `mailto:email@ejemplo.com?subject=ASUNTO&body=CUERPO_CODIFICADO`

---

## Fase 1 — UX profesional (quick wins)

Mejoras incrementales de experiencia de usuario sin tocar la arquitectura:

### 1. Dashboard rediseñado
- **Banner de alertas de vencimientos**: aviso rojo en la parte superior cuando hay plazos o tareas vencidos, con accesos directos a `/agenda` y `/tareas`. Conteos calculados con queries `lt(fecha, hoy)`.
- **Barra de accesos rápidos**: botones para Nuevo cliente, Nueva causa, Nueva cita, Nuevo plazo, Nuevo honorario y Nuevo documento.

### 2. Semáforo de alertas en el sidebar
- `(dashboard)/layout.tsx` calcula contadores por sección y los pasa al `Sidebar` como prop `alertas`.
- Badges en Tareas / Citas / Agenda:
  - 🔴 rojo = vencidos
  - 🟡 ámbar = por vencer (≤ 3 días)
  - 🔵 azul = citas de hoy

### 3. Estados vacíos profesionales
- Nuevo componente reutilizable `src/components/EmptyState.tsx` (icono + título + descripción + CTA).
- Aplicado en listados de Clientes, Causas y en el widget de causas del dashboard.

### 4. Toasts de confirmación (sonner)
- `<Toaster richColors position="top-right" closeButton />` montado en el layout del dashboard.
- Reemplazados todos los `alert()` por `toast.error(...)` y agregado `toast.success(...)` en cada flujo de creación/edición/eliminación (clientes, causas, citas, tareas, actuaciones, plazos, honorarios, documentos).

**Dependencia agregada:** `sonner ^1.5.0` (instalada con `--legacy-peer-deps`).

---

## Fase 2 — UX profesional (búsqueda, skeletons y finanzas)

### 5. Búsqueda global (Cmd+K)
- Endpoint `src/app/api/search/route.ts`: busca en clientes (nombre/RUT), causas (ROL/materia/contraparte) y citas (título), filtrado por `userId`, máx. 5 por grupo.
- Componente `src/components/GlobalSearch.tsx` (paleta de comandos):
  - Atajo **⌘K / Ctrl+K** para abrir, **Esc** para cerrar.
  - Búsqueda con debounce (220 ms) y `AbortController`.
  - Navegación con flechas ↑/↓ y Enter, resultados agrupados con iconos.
- Montado en una barra superior sticky en `(dashboard)/layout.tsx`.

### 6. Skeleton loading
- Primitivas reutilizables en `src/components/Skeleton.tsx`: `Skeleton`, `StatsSkeleton`, `TableSkeleton`, `HeaderSkeleton`, `CardsSkeleton`.
- Archivos `loading.tsx` (convención App Router) para: dashboard, clientes, causas, tareas, citas, agenda, documentos y honorarios.

### 7. Dashboard financiero mejorado
- Nueva KPI **Tasa de cobro** (pagado / emitido, excluye anulados) con barra de progreso.
- Gráfico de barras **Honorarios por mes** (emitido vs cobrado, últimos 6 meses) en `src/components/MonthlyBarChart.tsx` — CSS puro, sin librerías de charting.

---

## Fase 3 (parcial) — Módulo de IA

Asistente jurídico con IA, integrado en la página de detalle de cada causa.

### Arquitectura (proveedor intercambiable)
- `src/lib/ai/provider.ts` — interfaz `AIProvider` (`isConfigured()`, `complete()`), tipos y `AIError`.
- `src/lib/ai/anthropic.ts` — implementación sobre la Messages API de Anthropic (fetch directo).
- `src/lib/ai/index.ts` — factory `getAIProvider()`; cambiar de motor = devolver otra implementación aquí.
- `src/lib/ai/prompts.ts` — `buildCausaContext()`, prompts de sistema/usuario y `TIPOS_ESCRITO`.
- `src/lib/ai/causa-context.ts` — carga la causa (validando `userId`) y arma el contexto.

### Funciones
1. **Resumen de causa**: resumen ejecutivo (estado, últimas actuaciones, próximos hitos, acciones recomendadas).
2. **Borrador de escrito**: genera borradores según tipo (téngase presente, apelación, contestación, etc.) + instrucciones libres. Usa marcadores `[CITAR NORMA]` / `[COMPLETAR]` en vez de inventar datos.

### Rutas API
- `POST /api/ai/resumen`  → `{ causaId }` → `{ texto }`
- `POST /api/ai/borrador` → `{ causaId, tipo, instrucciones }` → `{ texto }`
- Ambas validan sesión (`getUserId`) y pertenencia de la causa; mapean `AIError` a HTTP (401/404/429/502/503).

### UI
- `src/components/AIPanel.tsx`: panel con pestañas Resumen / Borrador, estado de carga, botón copiar y aviso de revisión humana. Integrado en la columna lateral de `causas/[id]`.

### Configuración necesaria (Vercel → Environment Variables)
- `ANTHROPIC_API_KEY` — API key de Anthropic (obligatoria para activar la IA).
- `AI_MODEL` — opcional, default `claude-sonnet-4-6`.

Sin la key, el módulo responde con un aviso claro ("La IA no está configurada…") y el resto de la app funciona normalmente.
