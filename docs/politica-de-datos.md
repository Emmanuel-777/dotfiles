# Política de protección de datos — Implementación en LexCRM

Documento de referencia sobre cómo LexCRM cumple la normativa chilena de
protección de datos. Sirve para dos cosas:

1. Dejar por escrito qué controles existen y **dónde están en el código**.
2. Servir de guía para replicar el mismo estándar en otros proyectos
   (ver **Parte II: Guía para una landing page**).

Última actualización: agosto 2026.

---

## Marco legal aplicable

| Norma | Qué exige en la práctica |
|---|---|
| **Ley 21.719** (protección de datos personales) | Base de licitud, finalidad determinada, seguridad, derechos ARCO, notificación de brechas |
| **Ley 19.628** (vigente en lo no derogado) | Régimen previo de datos personales |
| **Art. 231 y 247 Código Penal** | Secreto profesional del abogado |
| **Ley 19.496** | Derechos del consumidor en la contratación del servicio |

Dos artículos mandan sobre el resto del diseño:

- **Arts. 24-25 Ley 21.719**: los datos sobre **infracciones penales** son
  categoría especial. Prohíben su tratamiento masivo fuera de las
  finalidades legítimas del responsable.
- **Deber de seguridad**: medidas técnicas proporcionales al riesgo. En un
  CRM legal el riesgo es alto, porque se cruzan datos identificatorios,
  procesales y penales.

---

## Principios de diseño

1. **Aislamiento por defecto.** Ningún dato es visible entre cuentas. No hay
   consulta que no filtre por usuario.
2. **Cifrado de lo más sensible en reposo.** Datos bancarios cifrados a nivel
   de aplicación, no solo del disco.
3. **Minimización.** No se pide ni se guarda lo que no se usa.
4. **Trazabilidad.** Las acciones sobre datos personales quedan registradas.
5. **Reversibilidad para el titular.** Puede llevarse sus datos y puede
   eliminarlos por completo.

---

# Parte I — Controles implementados en el CRM

## 1. Autenticación y control de acceso

- La identidad la gestiona **Clerk** (proveedor externo especializado). El
  CRM nunca almacena contraseñas.
- Un **middleware** protege todas las rutas: sin sesión válida no se llega a
  ninguna pantalla ni endpoint de datos.
- El acceso se controla por lista (`ALLOWED_EMAILS`) y/o por estado de la
  cuenta (`trial`, `activo`, `bloqueado`, `suspendido`).

**Archivos:** `src/middleware.ts`, `src/lib/acceso.ts`, `src/lib/auth.ts`

## 2. Aislamiento multi-inquilino (el control más importante)

Toda tabla tiene columna `user_id`, y **toda** consulta la filtra. No existe
un endpoint que devuelva datos sin ese filtro.

```ts
// Patrón aplicado sin excepción en todo el proyecto
const [cliente] = await db.select().from(clientes)
  .where(and(eq(clientes.id, params.id), eq(clientes.userId, userId)))
```

El `id` por sí solo nunca basta: siempre va acompañado del `userId`. Así, aun
conociendo el identificador de otro estudio, la consulta no devuelve nada.

Tablas cubiertas: `clientes`, `causas`, `actuaciones`, `asesorias`, `plazos`,
`documentos`, `honorarios`, `cuotas_honorario`, `tareas`, `gestiones_tarea`,
`citas`, `prospectos`, `perfil_abogado`, `registros_auditoria`, `cuentas`,
`uso_ia`.

## 3. Cifrado de datos sensibles en reposo

Los datos bancarios del abogado se cifran con **AES-256-GCM** antes de
guardarse, con formato versionado que permite distinguir valores cifrados de
filas antiguas en texto plano.

```
v1:<iv en base64>:<tag en base64>:<texto cifrado en base64>
```

- Clave de 32 bytes en la variable de entorno `ENCRYPTION_KEY`.
- GCM aporta **autenticación**: si el dato fue alterado, el descifrado falla.
- IV aleatorio distinto en cada cifrado.

**Campos cifrados:** `numero_cuenta`, `titular_rut` (tabla `perfil_abogado`).

**Archivos:** `src/lib/crypto.ts`, `src/app/api/perfil/route.ts`

> ⚠️ **Regla crítica de operación:** la `ENCRYPTION_KEY` **nunca** debe
> cambiarse ni regenerarse una vez que hay datos cifrados. Si se cambia, los
> datos existentes quedan ilegibles de forma permanente. No hay recuperación.

## 4. Documentos y archivos

- Se almacenan en **Vercel Blob con `access: 'private'`**: no son accesibles
  por URL pública aunque alguien adivine la ruta.
- La descarga pasa siempre por un endpoint propio que valida la sesión antes
  de entregar el archivo.
- Nombres con sufijo aleatorio (`addRandomSuffix`) para impedir enumeración.

**Archivos:** `src/app/api/documentos/`, `src/app/api/actuaciones/download/`,
`src/app/api/asesorias/download/`

## 5. Datos de infracciones penales (categoría especial)

Las causas de tipo **Penal** quedan excluidas de las exportaciones masivas,
en aplicación de los Arts. 24-25 de la Ley 21.719:

```ts
// Exportación de todo el estudio: se excluyen las causas penales
db.select().from(causas)
  .where(and(eq(causas.userId, userId), ne(causas.tipoCausa, 'Penal')))
```

El criterio es deliberado y proporcional: la exportación **de un cliente
individual** sí puede incluirlas (es tratamiento legítimo y acotado); la
extracción **masiva de todo el estudio** no.

**Archivos:** `src/app/api/exportar-todo/route.ts`

## 6. Registro de auditoría

Las acciones sobre datos personales se registran en `registros_auditoria`
(usuario, acción, entidad, identificador, detalle, fecha). Permite acreditar
diligencia ante un requerimiento y reconstruir qué ocurrió.

Escribir la auditoría **nunca puede tumbar la operación**: si falla, se
registra el error y la acción continúa.

**Archivos:** `src/lib/audit.ts`

## 7. Derechos del titular

| Derecho | Cómo se ejerce en el CRM |
|---|---|
| **Acceso** | Ficha completa del cliente y reporte imprimible |
| **Portabilidad** | Exportación en JSON: por cliente y de todo el estudio |
| **Rectificación** | Edición directa en cada ficha |
| **Supresión** | Eliminación por registro, o purga total de la cuenta |

## 8. Conservación y eliminación

Existe una **purga total** que borra los datos en orden hijo → padre y, como
último paso, elimina también el login en Clerk:

```
gestiones_tarea → cuotas_honorario → actuaciones → plazos → documentos →
tareas → asesorias → citas → honorarios → prospectos → causas → clientes →
perfil_abogado → registros_auditoria → cuentas → [login en Clerk]
```

El orden importa: borrar primero los registros dependientes evita dejar datos
huérfanos referenciando a un padre inexistente.

**Archivos:** `src/lib/cuentas.ts` (`purgarUsuario`),
`src/app/api/admin/cuentas/route.ts`

## 9. Asistente de inteligencia artificial

- Proveedor: **Anthropic (API de Claude)**, vía `ANTHROPIC_API_KEY`.
- El contexto enviado se **acota a la causa consultada**, filtrada por el
  `userId` de quien pregunta. No se envía la base completa.
- Se declara expresamente en la política pública (sección 13), porque implica
  transferencia internacional de datos.
- Hay tope diario de uso para cuentas de prueba (`TRIAL_IA_LIMITE`).

**Archivos:** `src/lib/ai/`, `src/lib/usoIa.ts`

## 10. Cookies y seguimiento

- El **Meta Pixel solo existe en la landing pública**, nunca dentro del CRM
  autenticado. Es una decisión de diseño deliberada: no se envía a un tercero
  ninguna señal del comportamiento de un abogado trabajando sobre datos de
  sus clientes.
- El pixel **no se carga hasta que la persona acepta** (consentimiento
  previo, no presunto). La elección se recuerda.
- Rechazar es tan fácil como aceptar: dos botones, mismo nivel.

**Archivos:** `landing/cookies.js`

## 11. Subencargados

| Proveedor | Función | Dónde |
|---|---|---|
| Vercel | Alojamiento y despliegue | EE.UU. |
| Turso / libSQL | Base de datos | Nube |
| Clerk | Autenticación | EE.UU. |
| Resend | Correos transaccionales | EE.UU. |
| Anthropic | Asistente de IA | EE.UU. |
| Meta | Pixel (solo landing, con consentimiento) | EE.UU. |

Todos declarados en la sección 8 de la política pública.

---

# Parte II — Guía para una landing page

Una landing tiene una superficie mucho menor que un CRM, pero es donde más se
incumple. Esto es lo mínimo exigible.

## Checklist

- [ ] **Aviso de cookies con consentimiento previo.** Nada de scripts de
      terceros (pixel, analítica, mapas de calor) antes del "Aceptar".
- [ ] **Rechazar igual de visible que aceptar.** Un "Rechazar" escondido o en
      gris claro no es consentimiento libre.
- [ ] **La elección se recuerda** y se puede cambiar después.
- [ ] **Política de privacidad enlazada** desde el pie de página y desde el
      propio aviso de cookies.
- [ ] **Formularios con finalidad declarada** junto al botón de envío: para
      qué se usarán los datos y quién responde por ellos.
- [ ] **Casilla de consentimiento sin premarcar** si se usará el dato para
      algo más que responder la consulta (por ejemplo, marketing).
- [ ] **Minimizar campos.** Cada campo debe justificarse. Si no se va a
      llamar por teléfono, no se pide el teléfono.
- [ ] **HTTPS** en todo el sitio.
- [ ] **Datos de contacto del responsable** visibles (nombre/razón social,
      RUT, correo de contacto para ejercer derechos).
- [ ] **Plazo de respuesta declarado** para solicitudes de derechos.
- [ ] **No enviar datos de formularios a terceros** sin declararlo.

## Patrón de consentimiento (reutilizable)

La lógica que funciona bien, en cuatro reglas:

1. Al cargar, se lee la elección guardada.
2. Si aceptó antes → se cargan los scripts y no se muestra nada.
3. Si rechazó antes → no se carga nada y no se muestra nada.
4. Si no hay elección → se muestra el aviso, y **solo** al aceptar se
   inyectan los scripts de terceros.

El código de `landing/cookies.js` implementa exactamente eso y se puede
adaptar cambiando el identificador del pixel y el texto.

## Estructura mínima de la política de privacidad

Las 16 secciones que usa LexCRM, aplicables a casi cualquier proyecto:

1. Identificación del responsable
2. Marco legal aplicable
3. Datos que se recopilan (desglosado por tipo de titular)
4. Finalidad del tratamiento
5. Aislamiento y seguridad de los datos
6. Datos sensibles y de infracciones penales
7. Notificación de incidentes de seguridad
8. Proveedores de servicios (subencargados)
9. Notificaciones por correo electrónico
10. Conservación de los datos
11. Derechos del titular
12. Responsabilidad del usuario sobre datos de terceros
13. Uso de inteligencia artificial *(si aplica)*
14. Cookies y tecnologías de seguimiento
15. Modificaciones a esta política
16. Contacto

> Para una landing simple, las secciones 6, 12 y 13 pueden omitirse si no hay
> datos sensibles, datos de terceros ni IA. **Las demás no.**

---

## Errores a evitar

| Error | Consecuencia |
|---|---|
| Cargar el pixel antes del consentimiento | Incumplimiento directo; el banner queda de adorno |
| Poner analítica o pixel dentro de la zona autenticada | Se filtra comportamiento sobre datos de terceros |
| Regenerar la clave de cifrado | Pérdida permanente e irreversible de los datos cifrados |
| Consultar por `id` sin filtrar por usuario | Un identificador filtrado expone datos de otra cuenta |
| Guardar secretos en el repositorio | Quedan en el historial de git para siempre |
| Exportar masivamente datos penales | Infringe los Arts. 24-25 de la Ley 21.719 |
| Borrar el padre antes que los hijos | Datos huérfanos que sobreviven a la "eliminación" |

---

## Referencia rápida de archivos

```
crm-abogados/src/
├── middleware.ts                  Protección de todas las rutas
├── lib/
│   ├── crypto.ts                  Cifrado AES-256-GCM
│   ├── auth.ts / acceso.ts        Identidad y autorización
│   ├── audit.ts                   Registro de auditoría
│   ├── cuentas.ts                 Ciclo de vida y purga total
│   └── ai/                        Asistente de IA
└── app/api/
    ├── exportar-todo/             Portabilidad (excluye causas penales)
    ├── clientes/[id]/exportar/    Portabilidad por cliente
    ├── documentos/                Almacenamiento privado
    └── admin/cuentas/             Eliminación de cuentas

landing/
├── cookies.js                     Consentimiento + pixel condicionado
└── politica-de-privacidad.html    Política pública (16 secciones)
```
