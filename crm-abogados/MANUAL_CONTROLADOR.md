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

### ✅ Restricción técnica real — `PLAN_PRO_EMAILS`

El Asistente IA (resúmenes y borradores dentro de cada causa) **ya está restringido en el código** por una segunda variable de entorno, con el mismo patrón manual que `ALLOWED_EMAILS`:

- `PLAN_PRO_EMAILS` en Vercel → lista de correos (separados por coma) que tienen plan Pro.
- Cualquier correo en `ALLOWED_EMAILS` que **no** esté en `PLAN_PRO_EMAILS` queda automáticamente en plan Básico: el panel de IA le muestra un candado con botón "Actualizar a Pro" en vez del generador, y los endpoints `/api/ai/resumen` y `/api/ai/borrador` devuelven 403 si igual se intenta llamar directo.
- Si `PLAN_PRO_EMAILS` no está definida, **todos** los clientes quedan en Básico (sin IA) — es el valor por defecto seguro.

**Importante al desplegar por primera vez:** si ya tienes clientes activos que pagan Pro, agrega sus correos a `PLAN_PRO_EMAILS` en el mismo redeploy en que subas este cambio — de lo contrario perderán acceso a la IA que ya venían usando.

---

## 2. Proceso de alta de un nuevo cliente

**Paso 1 — Llega el contacto.** El prospecto escribe por WhatsApp desde la landing (`wa.me/56979710838`) con un mensaje prellenado que ya indica el plan elegido: *"Hola, quiero contratar el plan Básico/Pro de LexCRM"*. Si escribió desde el botón de prueba gratis, el mensaje dice *"quiero probar LexCRM gratis 7 días"* — acceso completo al plan Pro (incluida la IA) durante 7 días, con recordatorio manual tuyo para quitarlo de `PLAN_PRO_EMAILS` (y de `ALLOWED_EMAILS` si no contrata) al terminar la semana.

**Paso 2 — Verificas el pago.** Le envías el mensaje de bienvenida con el precio del plan y los datos de tu cuenta bancaria (ver Sección 7), y confirmas la transferencia antes de activar el acceso (salvo trial gratuito).

**Paso 3 — Autorizas su email y su plan.**
1. Entra a **Vercel → proyecto del CRM → Settings → Environment Variables**.
2. Edita `ALLOWED_EMAILS` y agrega el correo del cliente, separado por coma de los que ya existen.
3. Si contrató **Pro** (o es trial gratuito), agrega el mismo correo también a `PLAN_PRO_EMAILS`. Si contrató **Básico**, no lo agregues ahí — queda sin IA automáticamente.
4. Guarda y ejecuta **Redeploy** (Deployments → los tres puntos del último deploy → Redeploy). Sin este paso los cambios no toman efecto.

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

`PLAN_PRO_EMAILS` te dice quién tiene Pro hoy, pero no guarda historial ni fecha de cobro. Sigue siendo necesaria tu propia planilla:

- Mantén una planilla simple (Google Sheets sirve) con columnas: Email, Nombre estudio, Plan, Fecha de alta, Próximo cobro, Estado (activo/moroso/dado de baja).
- Es tu fuente de verdad para saber a quién cobrarle este mes y a quién le corresponde estar en `PLAN_PRO_EMAILS`.

---

## 5. Cambios de plan y bajas

**Upgrade Básico → Pro:**
1. Vercel → `PLAN_PRO_EMAILS` → agrega el correo del cliente.
2. Redeploy.
3. Actualiza tu planilla y el nuevo monto de cobro. El cliente ve el Asistente IA disponible de inmediato, sin que tenga que hacer nada de su lado.

**Downgrade Pro → Básico:**
1. Vercel → `PLAN_PRO_EMAILS` → elimina el correo del cliente (déjalo en `ALLOWED_EMAILS`).
2. Redeploy. El panel de IA le pasa a mostrar el candado con "Actualizar a Pro" en su próxima visita.

**Cancelación total:**
1. Vercel → elimina el correo de `ALLOWED_EMAILS` (y de `PLAN_PRO_EMAILS` si correspondía).
2. Redeploy.
3. El cliente verá el mensaje de "cuenta pendiente de activación" (banner de la landing) la próxima vez que intente entrar — no se le borran sus datos, solo pierde acceso. Sus datos quedan en la base de datos de LexCRM hasta que se solicite eliminación formal (derecho de supresión, Ley 21.719).

**Renovación mensual:** no hay cobro automático (no hay pasarela de pago habilitada para Chile todavía). Debes recordar tú mismo, mes a mes, verificar la transferencia de cada cliente activo según tu planilla — de lo contrario no hay ninguna alerta del sistema que te avise de un pago vencido.

---

## 6. Resumen operativo (checklist rápido)

- [ ] Prospecto confirma plan y realiza transferencia
- [ ] Email agregado a `ALLOWED_EMAILS` en Vercel + Redeploy
- [ ] (Si es Pro o trial) Email agregado también a `PLAN_PRO_EMAILS`
- [ ] Cliente registrado en `app.lexcrm.site` con ese correo
- [ ] Cliente completó Mi Perfil
- [ ] Manual de Usuario PDF enviado
- [ ] Registrado en tu planilla de control de planes

---

## 7. Mensajes de bienvenida por WhatsApp (copiar y pegar)

Envía uno de estos dos mensajes apenas el prospecto confirma qué plan quiere contratar (Paso 2). Ya incluyen el precio y los datos bancarios reales — solo copia, pega y envía.

### Datos bancarios (para referencia rápida)

```
Soluciones con IA SpA
RUT: 78.464.829-K
Banco BCI
Cuenta Corriente N° 69584832
Email: contacto@lexcrm.site
```

### Mensaje — Plan Básico ($25.000/mes)

```
¡Hola! 👋 Gracias por tu interés en LexCRM.

Plan Básico — $25.000/mes
✅ Dashboard con semáforo de alertas
✅ Clientes, causas y honorarios
✅ Agenda, tareas y citas
✅ Embudo de prospectos

Para activar tu cuenta, realiza la transferencia a:

*Soluciones con IA SpA*
RUT: 78.464.829-K
Banco BCI
Cuenta Corriente N° 69584832
Email: contacto@lexcrm.site

Cuando nos envíes el comprobante, activamos tu acceso en minutos y te mandamos el Manual de Usuario para que empieces a trabajar de inmediato. ¿Alguna duda antes de partir?
```

### Mensaje — Plan Pro ($45.000/mes)

```
¡Hola! 👋 Gracias por tu interés en LexCRM.

Plan Pro — $45.000/mes
✅ Todo lo del plan Básico
✅ Asistente IA en cada causa
✅ Generación de resúmenes ejecutivos
✅ Borradores de escritos automáticos
✅ Soporte prioritario

Para activar tu cuenta, realiza la transferencia a:

*Soluciones con IA SpA*
RUT: 78.464.829-K
Banco BCI
Cuenta Corriente N° 69584832
Email: contacto@lexcrm.site

Cuando nos envíes el comprobante, activamos tu acceso en minutos (incluida la IA) y te mandamos el Manual de Usuario para que empieces a trabajar de inmediato. ¿Alguna duda antes de partir?
```

Los asteriscos simples (`*texto*`) son la sintaxis de negrita de WhatsApp — al pegar el mensaje se va a ver en negrita automáticamente, no hace falta editarlo.
