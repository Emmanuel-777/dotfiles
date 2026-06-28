# LexCRM — Manual de Usuario
## Guía para abogados

> Versión 1.0 · Sistema de gestión legal para abogados en Chile

---

## ¿Qué es LexCRM?

LexCRM es tu sistema de gestión legal en la nube. Te permite llevar el control de tus clientes, causas, honorarios, agenda, documentos y prospectos desde cualquier dispositivo con internet, sin instalar nada.

**Accedes desde:** el enlace que te entregó tu proveedor (ej. `tu-estudio.vercel.app`)

---

## Primer acceso

1. Abre el enlace de tu LexCRM en el navegador
2. Clic en **"Registrarse"**
3. Usa tu email autorizado (el que entregaste a tu proveedor) o inicia con Google
4. Sigue los pasos de verificación
5. Tu proveedor recibirá una notificación y aprobará tu acceso — esto puede tomar unos minutos
6. Una vez aprobado, entras directamente al **Dashboard**

> Si ves la pantalla "Acceso no autorizado", contacta a tu proveedor — puede que el email no coincida con el registrado.

---

## Pantalla principal — Dashboard

Al entrar, el Dashboard te muestra un resumen del estado de tu estudio:

- **Vencimientos próximos:** causas con plazos en los próximos 7 días
- **Accesos rápidos:** botones para agregar cliente, causa, honorario o cita
- **KPIs financieros:** total emitido vs cobrado en los últimos 6 meses, con gráfico de barras
- **Tasa de cobro:** porcentaje de honorarios efectivamente cobrados

El **semáforo en el menú lateral** te avisa de situaciones urgentes:
- 🔴 Rojo = vencido (requiere acción inmediata)
- 🟡 Amarillo = vence en 3 días o menos
- 🔵 Azul = citas programadas para hoy

---

## Menú lateral

| Sección | Para qué sirve |
|---|---|
| **Dashboard** | Resumen general |
| **Clientes** | Registro de tus clientes |
| **Causas** | Expedientes y seguimiento de casos |
| **Honorarios** | Facturación y cobros |
| **Agenda** | Citas y recordatorios |
| **Tareas** | Pendientes y seguimientos |
| **Embudo** | Gestión de prospectos (clientes potenciales) |

---

## Clientes

### Agregar un cliente
1. Menú → **Clientes** → clic en **"Nuevo cliente"**
2. Completa los datos:
   - **RUT** (obligatorio, sin puntos, con guión: `12345678-9`)
   - Nombre completo o razón social
   - Tipo: Persona natural o Jurídica
   - Email, teléfono, dirección (opcionales)
3. Clic en **"Guardar"**

### Buscar un cliente
- Usa la **barra de búsqueda** en la parte superior (ícono de lupa o atajo `Ctrl+K` / `Cmd+K`)
- Puedes buscar por nombre, RUT o email

### Ver el perfil de un cliente
Clic en el nombre del cliente → verás:
- Sus datos de contacto
- Todas sus causas asociadas
- Sus honorarios pendientes y pagados

---

## Causas

### Agregar una causa
1. Menú → **Causas** → **"Nueva causa"**
2. Completa:
   - **Cliente** (selecciona de la lista)
   - **Número de rol** (ej. `C-1234-2024`)
   - **Tribunal**
   - **Tipo de causa** (Civil, Laboral, Familia, Penal, etc.)
   - **Estado** (Activa, Suspendida, Terminada, Archivada)
   - **Fecha de ingreso**
   - **Fecha de vencimiento** (si aplica — activa el semáforo)
   - **Descripción / notas**
3. Guardar

### Seguimiento de una causa
Dentro de cada causa puedes:
- Editar los datos en cualquier momento
- Ver el historial de honorarios asociados
- Usar el **Asistente IA** (si está activado):
  - **"Generar resumen"**: crea un resumen ejecutivo de la causa
  - **"Borrador de escrito"**: genera un borrador basado en los datos del caso

---

## Honorarios

### Registrar un honorario
1. Menú → **Honorarios** → **"Nuevo honorario"**
2. Completa:
   - **Cliente y causa** asociada
   - **Concepto** (descripción del servicio)
   - **Monto** en pesos chilenos
   - **Estado:** Emitido, Pagado o Anulado
   - **Fecha de emisión** y **fecha de pago** (esta última al cobrar)
3. Guardar

### Marcar un honorario como pagado
1. Entra al honorario
2. Cambia el estado a **"Pagado"**
3. Ingresa la **fecha de pago**
4. Guardar

Los montos cobrados vs emitidos aparecen en el gráfico del Dashboard.

---

## Agenda

### Agregar una cita
1. Menú → **Agenda** → **"Nueva cita"**
2. Completa:
   - **Título** de la cita
   - **Fecha y hora**
   - **Cliente** (opcional)
   - **Descripción / notas**
3. Guardar

Las citas del día aparecen en el **badge azul** del menú lateral.

---

## Tareas

### Agregar una tarea
1. Menú → **Tareas** → **"Nueva tarea"**
2. Completa el título, fecha límite y prioridad
3. Guardar

Las tareas vencidas o próximas aparecen en el **semáforo** del menú.

---

## Embudo de prospectos

El embudo te permite gestionar clientes potenciales antes de que se conviertan en clientes reales.

### Etapas del embudo
```
Contacto → Reunión → Propuesta → Ganado / Perdido
```

### Agregar un prospecto
1. Menú → **Embudo** → **"Nuevo prospecto"**
2. Completa:
   - Nombre y empresa (si aplica)
   - Email y teléfono
   - Origen: cómo llegó a ti (Referido, Redes sociales, Web, etc.)
   - Etapa inicial
   - Valor estimado del caso (opcional, en pesos)
   - Próximo contacto (fecha de seguimiento)
3. Guardar

### Mover un prospecto entre etapas
En el tablero kanban, cada tarjeta tiene flechas `←` `→` para avanzar o retroceder el prospecto en el embudo.

### Convertir un prospecto en cliente
Cuando ganas el caso:
1. El prospecto pasa a etapa **"Ganado"**
2. Aparece el botón **"Convertir a cliente"**
3. Confirma los datos (se precargan automáticamente)
4. Ingresa el **RUT** del cliente
5. Se crea el cliente y quedan vinculados

### Recordatorios de seguimiento
Cada prospecto puede tener una **fecha de próximo contacto**:
- 🔴 Vencido → badge rojo en el menú
- 🟡 Vence en ≤3 días → badge amarillo
- El banner en la página del embudo muestra los pendientes

---

## Búsqueda global

Presiona `Ctrl+K` (Windows/Linux) o `Cmd+K` (Mac) desde cualquier pantalla para abrir la búsqueda global.

Puedes buscar:
- Clientes por nombre o RUT
- Causas por número de rol
- Honorarios por concepto

---

## Asistente IA (si está activado)

Disponible dentro de cada causa, en el panel lateral derecho.

### Generar resumen
1. Entra a una causa
2. Panel "Asistente IA" → **"Generar resumen"**
3. La IA lee los datos de la causa y genera un resumen ejecutivo en segundos

### Borrador de escrito
1. Panel "Asistente IA" → **"Borrador de escrito"**
2. Describe brevemente qué tipo de escrito necesitas
3. La IA genera un borrador que puedes copiar y editar

> El asistente IA es una herramienta de apoyo. Siempre revisa y ajusta el texto generado antes de usarlo.

---

## Cierre de sesión

Menú lateral → abajo del todo → **"Cerrar sesión"**

---

## Privacidad y seguridad de tus datos

- Tu información está cifrada y almacenada en servidores seguros en la nube
- Solo tú (y quienes tú autorices) pueden ver tus datos
- La contraseña la maneja Google o el sistema de verificación de email — nunca la vemos nosotros
- Puedes solicitar la exportación o eliminación de tus datos en cualquier momento contactando a tu proveedor

---

## Preguntas frecuentes

**¿Puedo acceder desde mi celular?**
Sí, la app funciona en cualquier navegador móvil (Chrome, Safari). No tiene app nativa por ahora.

**¿Qué pasa si pierdo mi contraseña?**
En la pantalla de login → **"¿Olvidaste tu contraseña?"** → recibes un email de recuperación.

**¿Mis datos se guardan automáticamente?**
Sí, cada formulario guarda al hacer clic en "Guardar". No hay pérdida de datos entre sesiones.

**¿Puedo usar LexCRM sin internet?**
No, requiere conexión a internet para funcionar.

**¿La IA puede equivocarse?**
Sí. El asistente IA es una herramienta de apoyo, no un sustituto del criterio legal. Siempre revisa el contenido generado.

**¿Cómo agrego a mi secretaria o socio?**
Contacta a tu proveedor para que autorice el email adicional.

---

## Soporte

Ante cualquier problema, contacta a tu proveedor de LexCRM con:
- Descripción del problema
- Captura de pantalla (si aplica)
- El email con el que intentabas acceder
