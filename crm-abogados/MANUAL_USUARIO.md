# LexCRM — Manual de Usuario
## Guía para abogados

> Versión 2.3 · Julio 2026 · Sistema de gestión legal para abogados en Chile
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
- WhatsApp de contacto
- Banco, tipo de cuenta, número de cuenta, nombre y RUT del titular

Los recordatorios automáticos de tareas, plazos y citas te llegan por **correo electrónico**, al mismo correo con el que accedes al sistema.

Estos datos son para que te lleguen los pagos que correspondan por citas u otros conceptos. El número de cuenta y el RUT se guardan **cifrados**.

Editable en cualquier momento desde "Mi Perfil" en el menú lateral.

**Respaldo de mis datos:** desde "Mi Perfil" → "Exportar todo mi estudio" descargas en un solo archivo todos tus clientes, prospectos, causas, actuaciones, asesorías, plazos, documentos, honorarios, cuotas, tareas y citas — útil como respaldo o para migrar a otro sistema. Las causas Penales quedan excluidas de esta exportación masiva (Ley N° 21.719); para respaldar una causa Penal puntual, usa la exportación individual desde la ficha del cliente.

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

**Autocompletar con IA (Plan Pro):** al crear un cliente, el botón **"Subir documento y autocompletar"** lee la cédula de identidad, un contrato o una foto con los datos (PDF, imagen o Word) y completa nombre, RUT, tipo y contacto. Revisa siempre antes de guardar; el archivo se usa solo para leerlo y **no se almacena**.

**Actuaciones del cliente:** en la ficha del cliente, la sección **"Actuaciones"** reúne las gestiones de todas sus causas (con el ROL de cada una y el documento adjunto si lo tiene). El botón **"Agregar"** permite registrar una gestión eligiendo a qué causa corresponde.

**Buscar:** barra superior o `Ctrl+K` / `Cmd+K`, por nombre, RUT o email.

**Eliminar:** desde Editar cliente → Eliminar cliente. Borra también todas sus causas, tareas, documentos, plazos y honorarios asociados — irreversible.

**Bitácora de Asesoría:** dentro de la ficha de cada cliente, un registro de las sesiones de asesoría que le das (independiente de sus causas). Cada entrada tiene fecha, tipo de consulta, notas y un documento adjunto opcional. Se puede editar o eliminar en cualquier momento desde "Editar" en la propia entrada.

**Reporte y Carátula:** desde la ficha del cliente, botón "Reporte" genera un informe de gestiones imprimible (causas, actuaciones, tareas, honorarios) y "Carátula" arma la carátula de un escrito judicial. Ambos documentos llevan en el encabezado tu nombre real (el de tu cuenta), no un nombre de estudio genérico.

---

## Causas

**Agregar:** Causas → Nueva causa → Cliente, ROL/RIT, Tribunal, Tipo (Civil, Laboral, Familia, Penal, Comercial, Tributario, Administrativo, Constitucional, Otro), Fecha de ingreso, Estado inicial (En Trámite / Suspendida / Terminada / Archivada).

**Autocompletar con IA (Plan Pro):** al crear una causa, si adjuntas la demanda o resolución (PDF, imagen JPG/PNG o Word `.docx`, hasta 4 MB), el botón **"Autocompletar campos con IA"** lee el documento y propone tribunal, ROL/RIT, materia, carátula y fecha. Revisa antes de guardar; el documento se usa solo para leerlo.

Dentro de cada causa: editar, plazos/audiencias, tareas, actuaciones (con compromisos y recordatorios al cliente, con fecha **y hora**, y **documento adjunto opcional** descargable), documentos, honorarios, Asistente IA.

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

**Pagos parciales por cuotas:** al poner un honorario en estado Parcial, aparece la sección "Cuotas y fechas de pago" — agrega cada cuota con su monto y fecha; cada una crea automáticamente una tarea de recordatorio de cobro. Las cuotas ya ingresadas se pueden marcar como pagadas, **editar** (monto y fecha, con el ícono de lápiz) o eliminar en cualquier momento.

**Botones de WhatsApp:** según el estado del honorario (y que el cliente tenga celular registrado):
- **Cobrar** (Pendiente/Parcial) — mensaje con el saldo pendiente real (no el monto total si ya hay cuotas pagadas) y tus datos bancarios si Mi Perfil está completo.
- **Comprobante** (cualquier estado salvo Anulado) — pide al cliente el comprobante de la transferencia.
- **Confirmar** (Pagado) — confirma que el pago quedó registrado en su carpeta.

**Tarjeta "Por cobrar":** en la parte superior de Honorarios, esta tarjeta es clickeable — al pincharla filtra la tabla mostrando solo quién tiene saldo pendiente, ordenado de mayor a menor deuda, con el saldo real (no el monto del contrato completo).

**Proyección de ingresos por mes:** tabla que agrupa lo esperado, cobrado y pendiente por mes — cada cuota se ubica en el mes en que vence (no todo el contrato en un solo mes), útil para proyectar ingresos y decidir si conviene aceptar pagos parciales. Cierra con una fila de **Consolidado general**. Cada mes de esta tabla es clickeable y filtra el detalle de abajo (combinable con "Por cobrar").

---

## Citas

**Agendar:** título, modalidad (Presencial, Google Meet, Zoom, Telefónica — botón "Crear sala" para Meet/Zoom), fecha/hora, cliente o prospecto (obligatorio) + causa (opcional), gratuita o valor.

**Confirmaciones y recordatorios automáticos por correo:**
- Al agendar, el **cliente o prospecto** recibe confirmación con opción de agregar la cita a Google Calendar o a su calendario (archivo .ics adjunto).
- Al agendar, **tú (el abogado)** también recibes un correo de confirmación con la misma opción de calendario.
- La noche anterior, recibes un resumen si tienes citas para el día siguiente.
- **1 hora y 30 minutos antes** de la cita, recibes un recordatorio automático — sin importar el estado (Pendiente o Confirmada).

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

**Agregar:** título, descripción, fecha y hora límite, prioridad (Baja/Media/Alta/Urgente), cliente o causa. Si el cliente no existe todavía, el botón **"+ Agregar cliente"** junto al selector abre un formulario rápido (tipo, nombre, RUT, email, celular) sin salir de la pantalla — al guardarlo queda seleccionado automáticamente en la tarea.

**Derivar a tercero:** casilla "Derivar a tercero" → nombre/correo del tercero + credenciales de portal opcionales (sistema/usuario/contraseña) — se guardan **cifradas**.

**Editar:** desde el ícono de lápiz junto a cada tarea, puedes modificar título, descripción, prioridad, estado y la fecha/hora límite o de compromiso.

**Gestiones:** en la misma pantalla de edición puedes ir agregando un historial de seguimiento de la tarea (ej. "llamé al cliente, quedó de enviar el documento el viernes") sin perder ni sobrescribir la tarea original.

---

## Embudo de prospectos

Etapas: Contacto → Reunión → Propuesta → Ganado / Perdido.

**Agregar prospecto:** nombre, empresa, contacto, origen, valor estimado, próximo contacto.

Mover entre etapas con flechas en el tablero. Al ganar, botón "Convertir a cliente" (precarga datos, pide RUT).

---

## Asistente de Inteligencia Artificial

> Disponible solo en el **plan Pro**. Si tu cuenta es plan Básico, el panel se muestra bloqueado con la opción de actualizar de plan.

Dentro de cada causa, panel lateral derecho:

- **Resumen de causa:** resumen ejecutivo a partir de actuaciones, plazos y tareas. El texto aparece **en tiempo real** (palabra por palabra) y cada dato viene respaldado con la **fecha de la actuación** que lo sustenta, para que puedas verificarlo de un vistazo.
- **Borrador de escrito:** elige tipo + instrucciones opcionales → borrador con estructura procesal chilena. Lleva una advertencia visible: es un apoyo que debes revisar y completar antes de presentarlo.

**Editar y enviar el resultado:**
- Botón **"Editar"**: modifica el resultado dentro de LexCRM, sin pasarlo a Word.
- Botón **"Copiar"** y botones **"Enviar al cliente"** (WhatsApp / correo): el texto sale **limpio**, sin símbolos de formato (`**`, `##`, tablas).

**Lectura de documentos (autocompletar):** además del resumen y el borrador, la IA puede leer documentos para ahorrarte tipear:
- Al crear una **causa**, autocompleta tribunal, ROL, materia y carátula desde la demanda o resolución.
- Al crear un **cliente**, autocompleta nombre, RUT y contacto desde la cédula, un contrato o una foto.
- Formatos: PDF, imagen (JPG/PNG) o Word `.docx`, hasta 4 MB. El documento se envía de forma segura solo para leerlo y **no se almacena** en ese proceso (conforme a la Ley N° 21.719).

> Herramienta de apoyo, no sustituye el criterio profesional. Revisa siempre antes de usar.

---

## Búsqueda global

`Ctrl+K` / `Cmd+K` desde cualquier pantalla. Busca clientes (nombre/RUT), causas (ROL), citas (título).

---

## Exportar o eliminar tus datos

**Exportar datos de un cliente:** ficha del cliente → "Exportar todos los datos" → descarga causas, actuaciones, plazos, documentos, honorarios, tareas y citas completas.

**Exportar todo tu estudio de una vez:** "Mi Perfil" → "Exportar todo mi estudio" → descarga en un solo archivo todos tus clientes, prospectos, causas, tareas, honorarios y citas. Las causas Penales quedan excluidas de esta exportación masiva (Ley N° 21.719) — para ellas usa la exportación individual del cliente.

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

**¿Celular?** Sí, funciona en cualquier navegador móvil. Además puedes instalarlo en la pantalla de inicio de tu celular (Chrome → "Instalar app" o "Agregar a pantalla de inicio") para abrirlo como una app, sin pasar por ninguna tienda de aplicaciones.

**¿Olvidé mi contraseña?** "¿Olvidaste tu contraseña?" en login → correo de recuperación.

**¿Se guarda automático?** Sí, al hacer clic en "Guardar".

**¿Sin internet?** No funciona offline.

**¿La IA se equivoca?** Sí, es apoyo — revisa siempre.

**¿Cómo agrego a mi secretaria o socio?** Hoy cada cuenta autorizada es independiente, no comparte los mismos clientes/causas entre correos distintos. Si necesitas trabajo compartido, contacta a tu proveedor — funcionalidad en desarrollo.

**¿Si dejo de pagar?** Los datos se conservan; el acceso se suspende hasta regularizar.

---

## Soporte

Desde el menú lateral (WhatsApp o correo). Incluye: descripción del problema, captura de pantalla si aplica, y el correo con el que accedes.
