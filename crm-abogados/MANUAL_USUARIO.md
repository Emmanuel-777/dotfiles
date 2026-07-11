# LexCRM — Manual de Usuario
## Guía para abogados

> Versión 2.0 · Julio 2026 · Sistema de gestión legal para abogados en Chile
>
> **Nota:** este archivo es la referencia de texto rápida. El documento oficial para entregar a clientes es `MANUAL_USUARIO.pdf` (diseñado para A4), generado a partir de `MANUAL_USUARIO.html`.

---

## ¿Qué es LexCRM?

LexCRM es tu sistema de gestión legal en la nube. Te permite llevar el control de tus clientes, causas, honorarios, agenda, documentos y prospectos desde cualquier dispositivo con internet, sin instalar nada.

Módulos: Dashboard, Clientes, Causas, Honorarios, Citas, Agenda y Plazos, Documentos, Tareas, Embudo, Asistente IA, Mi Perfil.

---

## Primer acceso y activación de tu cuenta

1. Recibes el enlace de acceso de tu proveedor.
2. "Registrarse" con el correo que entregaste al contratar.
3. Verificación de correo.
4. Tu proveedor autoriza tu correo específico — si intentas con otro correo, verás "Acceso no autorizado" (es normal mientras se confirma el pago).
5. Una vez autorizado, entras primero a completar tu perfil, luego al Dashboard.

---

## Mi Perfil — datos obligatorios

La primera vez, el sistema exige completar el perfil antes de dejarte usar el resto:

- Correo electrónico de contacto
- WhatsApp (recibes ahí los recordatorios de tareas pendientes)
- Banco, tipo de cuenta, número de cuenta, nombre y RUT del titular

Estos datos son para que te lleguen los pagos que correspondan por citas u otros conceptos. El número de cuenta y el RUT se guardan **cifrados**.

Editable en cualquier momento desde "Mi Perfil" en el menú lateral.

---

## Dashboard — pantalla principal

- Tarjetas: Clientes activos, Causas en trámite, Tareas activas, Plazos próximos, Honorarios por cobrar
- Accesos rápidos para crear cliente/causa/cita/plazo/honorario/documento
- Paneles: Próximos plazos, Causas recientes, Tareas activas, Recordatorios pendientes, y (si aplica) Causas penales próximas a prescribir
- Banner rojo si hay asuntos vencidos

---

## Navegación y semáforo de alertas

🔴 Vencido · 🟡 Próximo a vencer · 🔵 Citas de hoy

Menú: Dashboard, Embudo, Clientes, Causas, Tareas, Citas, Agenda y Plazos, Documentos, Honorarios, Mi Perfil, Soporte (WhatsApp/correo), Cerrar sesión.

---

## Clientes

**Agregar:** Clientes → Nuevo cliente → RUT (obligatorio, `12345678-9`), nombre, tipo (natural/jurídica), contacto (opcional) → Guardar.

**Buscar:** barra superior o `Ctrl+K` / `Cmd+K`, por nombre, RUT o email.

**Eliminar:** desde Editar cliente → Eliminar cliente. Borra también todas sus causas, tareas, documentos, plazos y honorarios asociados — irreversible.

---

## Causas

**Agregar:** Causas → Nueva causa → Cliente, ROL/RIT, Tribunal, Tipo (Civil, Laboral, Familia, Penal, Comercial, Tributario, Administrativo, Constitucional, Otro), Fecha de ingreso, Estado inicial (En Trámite / Suspendida / Terminada / Archivada).

Dentro de cada causa: editar, plazos/audiencias, tareas, actuaciones (con compromisos y recordatorios al cliente), documentos, honorarios, Asistente IA.

**Exportar listado:** Excel desde Causas — las causas Penales quedan excluidas por disposición legal.

---

## Causas penales — tratamiento especial

Conforme a la Ley N° 21.719:

- Campo adicional **Fecha de prescripción de la acción penal** (solo tipo Penal) — alerta en el Dashboard hasta 90 días antes.
- Excluidas de la exportación masiva de causas.
- Auditoría interna de accesos/exportaciones sensibles.

No limita el trabajo normal con la causa — solo restringe descargas masivas.

---

## Honorarios

**Registrar:** Cliente, causa (opcional), Tipo (Honorario/Gasto), descripción, monto CLP, fecha de emisión.

**Estados:** Pendiente, Parcial, Pagado, Anulado.

**Marcar pagado:** entra al honorario → cambia estado → fecha de pago → guardar.

---

## Citas

**Agendar:** título, modalidad (Presencial, Google Meet, Zoom, Telefónica — botón "Crear sala" para Meet/Zoom), fecha/hora, cliente o prospecto (obligatorio) + causa (opcional), gratuita o valor.

Envío automático de correo de confirmación y recordatorio la noche anterior.

**Estados:** Pendiente → Confirmada → Completada, o Cancelada.

---

## Agenda y Plazos

Distinto de Citas: plazos procesales (Audiencia, Vencimiento, Notificación, Presentación, Otro) ligados a una causa.

**Agregar:** causa, título, tipo, fecha, notas.

Vista en tres bloques: Vencidos, Próximos, Completados.

---

## Documentos

**Subir:** Documentos → Subir documento (o desde la causa) → archivo, nombre, tipo (Escrito, Resolución, Contrato, Poder, Otro), causa.

Listado central con acceso directo a la causa y descarga.

---

## Tareas

**Agregar:** título, descripción, fecha límite, prioridad (Baja/Media/Alta/Urgente), cliente o causa.

**Derivar a tercero:** casilla "Derivar a tercero" → nombre/correo del tercero + credenciales de portal opcionales (sistema/usuario/contraseña) — se guardan **cifradas**.

---

## Embudo de prospectos

Etapas: Contacto → Reunión → Propuesta → Ganado / Perdido.

**Agregar prospecto:** nombre, empresa, contacto, origen, valor estimado, próximo contacto.

Mover entre etapas con flechas en el tablero. Al ganar, botón "Convertir a cliente" (precarga datos, pide RUT).

---

## Asistente de Inteligencia Artificial

Dentro de cada causa, panel lateral derecho:

- **Resumen de causa:** resumen ejecutivo a partir de actuaciones, plazos y tareas.
- **Borrador de escrito:** elige tipo + instrucciones opcionales → borrador editable.

> Herramienta de apoyo, no sustituye el criterio profesional. Revisa siempre antes de usar.

---

## Búsqueda global

`Ctrl+K` / `Cmd+K` desde cualquier pantalla. Busca clientes (nombre/RUT), causas (ROL), citas (título).

---

## Exportar o eliminar tus datos

**Exportar datos de un cliente:** ficha del cliente → "Exportar todos los datos" → descarga causas, actuaciones, plazos, documentos, honorarios, tareas y citas completas.

**Eliminar cliente:** Editar cliente → Eliminar cliente — borrado permanente e irreversible de todo lo asociado.

---

## Privacidad y seguridad

- Cifrado en tránsito (HTTPS) y en reposo.
- Credenciales de portal y cuenta bancaria con cifrado reforzado adicional.
- Acceso restringido solo a cuentas autorizadas.
- Contraseña gestionada por el sistema de autenticación — nunca visible para el proveedor.
- Tratamiento reforzado para causas penales (Ley N° 21.719).
- Exportación/eliminación de datos disponible en cualquier momento.
- Registro interno de auditoría en exportaciones y eliminaciones.

---

## Preguntas frecuentes

**¿Celular?** Sí, cualquier navegador móvil, sin app nativa.

**¿Olvidé mi contraseña?** "¿Olvidaste tu contraseña?" en login → correo de recuperación.

**¿Se guarda automático?** Sí, al hacer clic en "Guardar".

**¿Sin internet?** No funciona offline.

**¿La IA se equivoca?** Sí, es apoyo — revisa siempre.

**¿Cómo agrego a mi secretaria o socio?** Hoy cada cuenta autorizada es independiente, no comparte los mismos clientes/causas entre correos distintos. Si necesitas trabajo compartido, contacta a tu proveedor — funcionalidad en desarrollo.

**¿Si dejo de pagar?** Los datos se conservan; el acceso se suspende hasta regularizar.

---

## Soporte

Desde el menú lateral (WhatsApp o correo). Incluye: descripción del problema, captura de pantalla si aplica, y el correo con el que accedes.
