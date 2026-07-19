# Postulación Start-Up Chile — IGNITE
## Contexto para retomar en nueva conversación

---

## 1. El producto: LexCRM

**Qué es:** SaaS B2B — CRM especializado para abogados chilenos.

**URL actual (producción):** landing en `lexcrm.site`, app en `app.lexcrm.site`
**Stack:** Next.js 14 App Router · Drizzle ORM · Turso (SQLite) · Clerk (auth) · Claude (Anthropic, resumen/borrador de escritos) · Resend (email) · Vercel
**Repositorio:** `github.com/Emmanuel-777/dotfiles` (carpeta `crm-abogados/`)

**Módulos construidos (estado real, jul-2026):**
- Dashboard con semáforo de alertas (vencidos / críticos / hoy)
- Clientes (ficha, RUT, tipo persona natural/jurídica), Bitácora de Asesoría, exportación individual y masiva de datos (Ley 21.719, excluye causas Penales)
- Causas (ROL/RIT, tribunal, tipo, estado, actuaciones con compromisos y hora), tratamiento especial de causas Penales (alerta de prescripción a 90 días, auditoría de accesos)
- Agenda y Plazos, con calculadora de plazos por días hábiles/corridos según materia (CPC, CPP, Ley 19.968, Ley 19.880)
- Tareas (con delegación a terceros, credenciales de portal cifradas, creación de cliente sin salir del formulario)
- Citas (presencial / Meet / Zoom / telefónica): confirmación al cliente y al abogado con Google Calendar/.ics, recordatorio 1h y 30min antes
- Honorarios: estados con pagos parciales por cuotas (cada cuota crea su tarea de cobro), cobro/comprobante/confirmación por WhatsApp, proyección de ingresos por mes con filtro clickeable
- Documentos, Embudo de ventas (prospectos / etapas / conversión a cliente)
- Asistente virtual IA (chat de ayuda) + Asistente IA por causa (resumen ejecutivo y borrador de escritos con contexto real de la causa, envío directo por WhatsApp/correo) — exclusivo Plan Pro
- Cifrado reforzado (AES-256-GCM) de credenciales de portal y datos bancarios
- Exportar causas a Excel (CSV UTF-8 con BOM), búsqueda global (⌘K)
- Responsive / instalable como PWA desde el navegador móvil
- Monitoreo de disponibilidad (uptime) activo

**Planes de precio definidos:**
| Plan | Precio/mes |
|---|---|
| Básico | $25.000 CLP |
| Pro | $45.000 CLP |

(Plan "Firma" queda oculto en la landing por ahora, pendiente de definir alcance).

Cobro por transferencia bancaria manual a la cuenta corriente de Soluciones Con IA SpA (Banco BCI) — sin pasarela de pago automatizada por ahora.

**Diferenciadores clave para el pitch:**
- Único CRM vertical para el mercado legal chileno
- IA integrada con contexto real de cada causa (no un chat genérico aparte) — resumen ejecutivo y borrador de escritos con estructura procesal chilena
- Multi-tenant (cada usuario ve solo sus datos)
- Semáforo visual de plazos vencidos / críticos
- Calculadora de plazos legales por días hábiles según materia — no existe en ningún competidor conocido
- Precio en CLP, pago por transferencia bancaria directa (sin Stripe, sin dólares, sin comisión de pasarela)
- Funciona en móvil (responsive/PWA)
- 7 días de prueba gratuita
- Cumplimiento activo de la Ley 21.719 (protección de datos personales) desde el diseño, no como parche

---

## 2. El fondo: Start-Up Chile IGNITE

**Institución:** CORFO / Start-Up Chile  
**Web oficial:** https://startupchile.org/en/apply/ignite/  
**Monto:** $30.000.000 CLP no reembolsables  
**Duración:** 4 meses de aceleración intensiva  
**Equity:** No toma participación (equity-free)

### Requisitos clave
- Tener un **MVP funcional** (ya lo tenemos ✅)
- Empresa constituida en Chile de **menos de 3 años**
- Al menos **1 fundador dedicado** al proyecto
- Producto con potencial de **escala** (no solo local)
- Postulación en inglés o español

### Qué evalúan
1. **Problema real y tamaño de mercado** — Chile tiene ~45.000 abogados activos
2. **Solución diferenciada** — no hay CRM vertical legal local
3. **Tracción** — clientes pagando, demos agendadas, lista de espera
4. **Equipo** — quién lo construyó, qué capacidades tiene
5. **Modelo de negocio** — SaaS recurrente, ticket claro, churn bajo

---

## 3. Tareas pendientes antes de postular

### Legales (urgente)
- [x] Constituir **SPA** — Soluciones Con IA SpA, RUT 78.464.829-K
- [x] **Inicio de actividades en SII**
- [x] Abrir cuenta bancaria empresarial — BCI, Cuenta Corriente
- [x] Registrar dominio propio — `lexcrm.site` (landing) + `app.lexcrm.site` (CRM)

### Comerciales (para tener tracción al momento de postular)
- [x] Conseguir **mínimo 3 clientes pagando** — ✅ 3 clientes, todos en **Plan Pro** ($45.000 c/u)
- [x] Calcular **MRR** — **$135.000 CLP/mes** (al 19-jul-2026)
- [ ] Registrar tasa de conversión del período de prueba
- [ ] Testimonios o cartas de intención de abogados / estudios jurídicos

> Nota: tracción muy reciente (clientes pagando hace menos de 1 mes) — aún no hay dato de retención/renovación que mostrar. Es un punto a fortalecer antes de postular, o a mencionar honestamente como "tracción temprana validada" en el pitch.

### Pitch Deck (10-12 slides)
- [ ] Slide 1 — Portada: logo LexCRM + tagline
- [ ] Slide 2 — Problema: abogados en Chile gestionan con Excel y WhatsApp
- [ ] Slide 3 — Solución: demo visual del CRM (capturas de pantalla)
- [ ] Slide 4 — Mercado: 45.000 abogados, ~3.000 estudios jurídicos
- [ ] Slide 5 — Modelo de negocio: SaaS $25K-$90K CLP/mes
- [ ] Slide 6 — Tracción: MRR, clientes activos, tasa retención
- [ ] Slide 7 — Diferenciadores: IA, vertical legal, precio CLP
- [ ] Slide 8 — Roadmap: módulo jurisprudencia, app móvil nativa, facturación electrónica SII
- [ ] Slide 9 — Equipo: fundador(es), experiencia
- [ ] Slide 10 — Uso del fondo: breakdown de los $30M CLP

### Uso sugerido de los $30M CLP
| Ítem | Monto estimado |
|---|---|
| Infraestructura (Vercel, Turso, APIs IA 12 meses) | $3.000.000 |
| Desarrollo features Pro (jurisprudencia, facturación SII) | $8.000.000 |
| Marketing digital (Google Ads, LinkedIn abogados) | $7.000.000 |
| Ventas (demos, onboarding clientes) | $5.000.000 |
| Legal y contabilidad empresa | $3.000.000 |
| Reserva operacional | $4.000.000 |
| **Total** | **$30.000.000** |

---

## 4. Ángulo ganador del pitch

> *"El 90% de los abogados en Chile gestiona sus causas con Excel y correo. LexCRM es el primer CRM legal vertical chileno con IA integrada, diseñado específicamente para los 45.000 profesionales del derecho del país — un mercado desatendido de $16.000 millones CLP anuales en suscripciones potenciales."*

**Métricas de mercado para reforzar:**
- 45.000 abogados habilitados en Chile (Colegio de Abogados)
- ~3.000 estudios jurídicos con más de 2 profesionales
- Ticket promedio apuntado: $45.000 CLP/mes (plan Pro)
- TAM estimado (100% mercado): ~$24.000M CLP/año
- SAM realista (10% penetración en 5 años): ~$2.400M CLP/año

---

## 5. Features de roadmap para mencionar en el pitch

Ya construido (ya no es roadmap, es tracción de producto): recordatorios automáticos por email de plazos/citas, reportes PDF de estado de causa para el cliente (Reporte + Carátula), respaldo/exportación de datos.

Pendientes, viables y aumentan el puntaje de "escalabilidad":

1. **Búsqueda de jurisprudencia con IA** — integración con buscador del Poder Judicial (juris.pjud.cl) + síntesis Claude
2. **App móvil nativa** — React Native (hoy es PWA instalable, no nativa)
3. **Facturación electrónica SII** — integración con API del SII para emitir boletas/facturas desde el CRM
4. **Multi-usuario por estudio** — roles (socio, asociado, administrativo) — hoy cada cuenta es independiente
5. **Recordatorios automáticos por WhatsApp** (hoy solo por email)
6. **Flujos de trabajo personalizables por materia** — plantillas de etapas según tipo de causa

---

## 6. Recursos y links importantes

| Recurso | URL |
|---|---|
| Start-Up Chile Ignite | https://startupchile.org/en/apply/ignite/ |
| Requisitos Build (referencia) | https://startupchile.org/en/apply/build/ |
| CORFO portal fondos | https://www.fondos.gob.cl |
| Ecosistema Startup Chile | https://ecosistemastartup.com |
| SII inicio actividades | https://zeus.sii.cl |
| Registro de empresa (SPA) | https://www.registrodeempresasysociedades.cl |

---

## 7. Instrucciones para la nueva conversación

Al iniciar la conversación en Claude, pega este archivo y di algo como:

> *"Tengo un SaaS llamado LexCRM para abogados chilenos. Quiero postular al fondo Start-Up Chile IGNITE. Aquí está el contexto completo del proyecto y lo que necesito preparar. Ayúdame a [armar el pitch deck / redactar el formulario de postulación / calcular el TAM / preparar el breakdown del presupuesto]."*

---

*Documento generado el 28 de junio de 2026*  
*Proyecto: LexCRM — CRM para abogados chilenos*
