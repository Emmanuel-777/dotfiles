# Manual del Controlador — LexCRM

Versión 1.0 — julio 2026

Este manual es para **ti** (el operador/dueño del negocio LexCRM), no para el abogado cliente. Explica el proceso real, paso a paso, para dar de alta a un nuevo cliente según el plan que contrató, y cómo darle soporte una vez adentro.

---

## 1. Los planes vigentes

| | **Básico** — $25.000/mes | **Pro** — $45.000/mes |
|---|---|---|
| Usuarios | 1 | 1 |
| Dashboard, alertas, plazos | ✅ | ✅ |
| Clientes, causas, honorarios | ✅ | ✅ |
| Agenda, tareas, citas | ✅ | ✅ |
| Embudo de prospectos | ✅ | ✅ |
| Asistente IA (resúmenes, borradores) | ❌ | ✅ |
| Soporte prioritario | — | ✅ |

Precios y features tal como están publicados hoy en `landing/index.html`. El plan "Firma" (multiusuario) está oculto hasta que el producto soporte roles/organizaciones.

### ⚠️ Nota importante — restricción técnica real

**Hoy el sistema NO restringe automáticamente el Asistente IA por plan.** LexCRM es una única aplicación multi-tenant: cualquier email que agregues a `ALLOWED_EMAILS` obtiene acceso a **todas** las funciones, incluida la IA, sin importar si el cliente pagó Básico o Pro. La diferenciación de planes es hoy **comercial, no técnica**.

Mientras no se implemente un gating real (una columna `plan` en `perfilAbogado` + un chequeo en el endpoint `/api/ai/*` y en el botón de la UI), debes:
- Avisar tú mismo al cliente Básico que el botón de IA no está incluido en su plan (aunque lo vea disponible), o
- Aceptar que, en la práctica, todo cliente activo tiene acceso completo hasta que se construya la restricción.

No prometas a un inversionista ni a un cliente que el límite ya está aplicado en el código — no lo está.

---

## 2. Proceso de alta de un nuevo cliente

**Paso 1 — Llega el contacto.** El prospecto escribe por WhatsApp desde la landing (`wa.me/56979710838`) con un mensaje prellenado que ya indica el plan elegido: *"Hola, quiero contratar el plan Básico/Pro de LexCRM"*. Si escribió desde el botón de prueba gratis, el mensaje dice *"quiero probar LexCRM gratis 7 días"* (acceso completo por 7 días, se le indica igual en `ALLOWED_EMAILS`, con recordatorio manual tuyo para dar de baja si no contrata al terminar la semana).

**Paso 2 — Verificas el pago.** Le envías los datos de tu cuenta bancaria y confirmas la transferencia antes de activar el acceso (salvo trial gratuito).

**Paso 3 — Autorizas su email.**
1. Entra a **Vercel → proyecto del CRM → Settings → Environment Variables**.
2. Edita `ALLOWED_EMAILS` y agrega el correo del cliente, separado por coma de los que ya existen.
3. Guarda y ejecuta **Redeploy** (Deployments → los tres puntos del último deploy → Redeploy). Sin este paso el cambio no toma efecto.

**Paso 4 — Le envías las credenciales de entrada.** Comparte con el cliente:
- El enlace: `https://app.lexcrm.site`
- Instrucción: clic en **"Registrarse"**, usar exactamente el correo que autorizaste en el paso 3.
- El **Manual de Usuario** en PDF (ya existe como entregable estándar, mencionado en la landing como "incluido en todos los planes").

**Paso 5 — El cliente completa su perfil.** Al primer ingreso, `ProfileGuard` lo redirige obligatoriamente a **Mi Perfil** hasta que complete sus datos de contacto y cuenta bancaria (para emisión de honorarios). No puede usar el resto del CRM hasta hacerlo — es normal, no es un error.

**Paso 6 — Queda operativo.** Desde ahí el cliente ya puede cargar sus propios clientes y causas.

---

## 3. Cómo el cliente crea SUS clientes dentro del CRM

Para poder darle soporte, necesitas conocer el flujo: **Clientes → Nuevo cliente**. Campos del formulario:

| Campo | Detalle |
|---|---|
| Tipo de cliente | Persona natural / Persona jurídica |
| Nombre o razón social | Obligatorio |
| RUT | Obligatorio, formato `12.345.678-9` |
| Email | Opcional |
| Teléfono fijo / Celular | Opcional |
| Dirección, Ciudad, Región | Opcional |
| Notas internas | Libre — preferencias de contacto, observaciones |

No hay límite de cantidad de clientes por cuenta en ningún plan — la diferencia Básico/Pro es solo el Asistente IA, no volumen de datos.

---

## 4. Llevar registro de qué plan tiene cada cliente

El sistema **no guarda** qué plan contrató cada abogado — esa información vive únicamente en tu cabeza o en tu propia planilla, porque `ALLOWED_EMAILS` es solo una lista de correos sin metadata de plan. Mientras no exista una columna `plan` en la base de datos:

- Mantén una planilla simple (Google Sheets sirve) con columnas: Email, Nombre estudio, Plan, Fecha de alta, Próximo cobro, Estado (activo/moroso/dado de baja).
- Es tu única fuente de verdad para saber a quién cobrarle este mes y a quién limitar el uso de IA "de palabra" mientras el plan Básico no tiene bloqueo técnico.

---

## 5. Cambios de plan y bajas

**Upgrade Básico → Pro:** no requiere cambio técnico (el cliente ya tenía acceso a la IA de facto) — solo actualiza tu planilla y el nuevo monto de cobro.

**Downgrade o cancelación:**
1. Vercel → `ALLOWED_EMAILS` → elimina el correo del cliente.
2. Redeploy.
3. El cliente verá el mensaje de "cuenta pendiente de activación" (banner de la landing) la próxima vez que intente entrar — no se le borran sus datos, solo pierde acceso. Sus datos quedan en la base de datos de LexCRM hasta que se solicite eliminación formal (derecho de supresión, Ley 21.719).

**Renovación mensual:** no hay cobro automático (no hay pasarela de pago habilitada para Chile todavía). Debes recordar tú mismo, mes a mes, verificar la transferencia de cada cliente activo según tu planilla — de lo contrario no hay ninguna alerta del sistema que te avise de un pago vencido.

---

## 6. Resumen operativo (checklist rápido)

- [ ] Prospecto confirma plan y realiza transferencia
- [ ] Email agregado a `ALLOWED_EMAILS` en Vercel + Redeploy
- [ ] Cliente registrado en `app.lexcrm.site` con ese correo
- [ ] Cliente completó Mi Perfil
- [ ] Manual de Usuario PDF enviado
- [ ] Registrado en tu planilla de control de planes
- [ ] (Si es Básico) Avisado de que la IA no está incluida en su plan
