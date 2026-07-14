# Postulación Start-Up Chile — IGNITE
## Contexto para retomar en nueva conversación

---

## 1. El producto: LexCRM

**Qué es:** SaaS B2B — CRM especializado para abogados chilenos.

**URL actual (producción):** `dotfiles-iota.vercel.app`  
**Stack:** Next.js 14 App Router · Drizzle ORM · Turso (SQLite) · Clerk (auth) · Claude Haiku (IA) · Vercel  
**Repositorio:** `github.com/Emmanuel-777/dotfiles` (carpeta `crm-abogados/`)

**Módulos ya construidos:**
- Dashboard con semáforo de alertas (vencidos / críticos / hoy)
- Clientes (ficha, RUT, tipo persona natural/jurídica)
- Causas (ROL/RIT, tribunal, tipo, estado, plazos, actuaciones)
- Agenda y Plazos
- Tareas (con delegación a terceros)
- Citas (presencial / videollamada, cobro por consulta)
- Honorarios (honorario / boleta / factura / saldo)
- Documentos
- Embudo de ventas (prospectos / etapas / conversión a cliente)
- Asistente virtual IA (chat flotante, usa Claude Haiku)
- Exportar causas a Excel (CSV UTF-8 con BOM)
- Búsqueda global (clientes, causas, citas)
- Sidebar responsive (drawer en móvil)

**Planes de precio definidos:**
| Plan | Precio/mes |
|---|---|
| Básico | $25.000 CLP |
| Pro | $45.000 CLP |
| Firma | $90.000 CLP |

Cobro por transferencia bancaria manual a la cuenta corriente de Soluciones con IA SpA (Banco BCI) — sin pasarela de pago automatizada por ahora.

**Diferenciadores clave para el pitch:**
- Único CRM vertical para el mercado legal chileno
- IA integrada (asistente virtual Claude Haiku)
- Multi-tenant (cada usuario ve solo sus datos)
- Semáforo visual de plazos vencidos / críticos
- Precio en CLP, pago por transferencia bancaria directa (sin Stripe, sin dólares, sin comisión de pasarela)
- Funciona en móvil (responsive)
- 7 días de prueba gratuita

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
- [ ] Constituir **SPA** (Sociedad por Acciones) — recomendado sobre LTDA por flexibilidad
- [ ] **Inicio de actividades en SII** con giro: *"Desarrollo y venta de software"* (código 6201)
- [ ] Abrir cuenta bancaria empresarial (BCI, Banco Estado o similar)
- [ ] Registrar dominio propio (ej: `lexcrm.cl`)

### Comerciales (para tener tracción al momento de postular)
- [ ] Conseguir **mínimo 3 clientes pagando** y documentarlos
- [ ] Calcular **MRR** (ingresos mensuales recurrentes) al momento de postular
- [ ] Registrar tasa de conversión del período de prueba
- [ ] Testimonios o cartas de intención de abogados / estudios jurídicos

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

Estas funcionalidades aún no están desarrolladas pero son viables y aumentan el puntaje de "escalabilidad":

1. **Búsqueda de jurisprudencia con IA** — integración con buscador del Poder Judicial (juris.pjud.cl) + síntesis Claude
2. **App móvil nativa** — React Native o PWA avanzada
3. **Facturación electrónica SII** — integración con API del SII para emitir boletas/facturas desde el CRM
4. **Multi-usuario por estudio** — roles (socio, asociado, administrativo)
5. **Recordatorios automáticos por email/WhatsApp** — plazos y citas
6. **Reportes para clientes** — PDF de estado de causa para enviar al cliente

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
