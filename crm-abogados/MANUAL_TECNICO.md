# Manual Técnico — LexCRM
## Guía del desarrollador / vendedor

> Para uso interno. Cubre cómo desplegar una instancia de LexCRM para un nuevo cliente abogado.

---

## Arquitectura general

Cada cliente abogado recibe su **propia instancia independiente**:

```
Cliente A (abogado)          Cliente B (abogado)
  └── Vercel project A          └── Vercel project B
  └── Turso database A          └── Turso database B
  └── Clerk instance A          └── Clerk instance B
```

Esto garantiza aislamiento total de datos entre clientes. Un problema en la instancia de un cliente no afecta a los demás.

---

## Cuentas necesarias (una vez, gratuitas)

Antes de onboardear al primer cliente, necesitas cuentas en:

| Servicio | URL | Plan mínimo |
|---|---|---|
| GitHub | github.com | Free |
| Vercel | vercel.com | Free (Hobby) |
| Clerk | clerk.com | Free (hasta 10.000 MAU) |
| Turso | turso.tech | Free (hasta 500 DBs) |
| Anthropic *(opcional, para IA)* | console.anthropic.com | Pago por uso |

---

## Paso a paso: onboardear un nuevo cliente

### 1. Crear la base de datos en Turso

1. Entra a [turso.tech](https://turso.tech) → **Databases → Create database**
2. Nombre: `lexcrm-[nombre-cliente]` (ej. `lexcrm-estudio-perez`)
3. Región: elige la más cercana a Chile → **South America (São Paulo)** o similar
4. Clic en **"Create"**
5. Una vez creada, clic en **"Generate auth token"** → copia el token
6. Copia también la **Database URL** (formato: `libsql://...turso.io`)

Guarda ambos valores — los necesitarás en el Paso 3.

---

### 2. Crear la instancia de Clerk (Production)

1. Entra a [dashboard.clerk.com](https://dashboard.clerk.com) → **Create application**
2. Nombre: `LexCRM - [Nombre Cliente]`
3. Métodos de login: activa **Google** y **Email**
4. Clic en **"Create application"**
5. Ve a **Configure → Sessions → Customize session token** → agrega:
   ```json
   { "email": "{{user.primary_email_address}}" }
   ```
   Guarda.
6. Ve a **Configure → Protect → Restrictions → Waitlist** → activa el toggle
7. En el menú izquierdo → **API Keys** → copia:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

> **Importante:** crea siempre la instancia en modo **Production** (no Development). Al crear la app, Clerk te dará la opción.

---

### 3. Hacer fork / duplicar el proyecto en Vercel

**Opción A — Nuevo proyecto desde el mismo repo (recomendado):**

1. Entra a [vercel.com](https://vercel.com) → **Add New → Project**
2. Importa el repositorio `emmanuel-777/dotfiles`
3. En **Root Directory** escribe: `crm-abogados`
4. Clic en **"Deploy"** (fallará al principio — eso es normal, falta configurar las variables)

**Opción B — Clonar el repo y hacer push a uno nuevo:**
```bash
git clone https://github.com/emmanuel-777/dotfiles.git lexcrm-cliente
cd lexcrm-cliente
# Crear nuevo repo en GitHub para el cliente, luego:
git remote set-url origin https://github.com/TU_USUARIO/lexcrm-cliente.git
git push -u origin main
```
Luego importar ese repo en Vercel.

---

### 4. Configurar variables de entorno en Vercel

En el proyecto Vercel recién creado → **Settings → Environment Variables**, agrega:

| Key | Valor | Cómo obtenerlo |
|---|---|---|
| `TURSO_DATABASE_URL` | `libsql://...turso.io` | Turso → tu database → Connection string |
| `TURSO_AUTH_TOKEN` | `eyJ...` | Turso → tu database → Generate auth token |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Clerk → API Keys |
| `CLERK_SECRET_KEY` | `sk_live_...` | Clerk → API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Literal |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Literal |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` | Literal |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` | Literal |
| `ALLOWED_EMAILS` | `email@cliente.com` | El email del abogado cliente |
| `ANTHROPIC_API_KEY` *(opcional)* | `sk-ant-...` | console.anthropic.com |
| `AI_MODEL` *(opcional)* | `claude-sonnet-4-6` | Literal |

Una vez agregadas todas → **Deployments → Redeploy**.

---

### 5. Dar acceso al cliente (abogado)

El cliente debe crear su cuenta con el email que registraste en `ALLOWED_EMAILS`.

1. Comparte con el cliente la URL de su app (ej. `lexcrm-estudio-perez.vercel.app`)
2. El cliente entra → clic en **"Registrarse"** → usa su email autorizado
3. Clerk lo pone en **Waitlist** — tú debes aprobarlo:
   - Clerk Dashboard → **Users → Waitlist**
   - Busca el email del cliente → clic en **"Approve"**
4. El cliente recibe confirmación y ya puede entrar

---

### 6. Dominio personalizado (opcional pero recomendado)

Para que el cliente use `crm.estudioperez.cl` en vez de una URL de Vercel:

1. Vercel → tu proyecto → **Settings → Domains → Add**
2. Escribe el dominio del cliente
3. Vercel te dará un registro DNS (CNAME o A)
4. El cliente (o tú) lo configura en su registrador de dominio
5. Vercel activa el certificado SSL automáticamente (~5 minutos)

---

### 7. Configurar dominio en Clerk (si usas dominio propio)

Cuando el cliente tiene dominio propio, debes actualizar Clerk:

1. Clerk Dashboard → **Configure → Domains → Add domain**
2. Agrega el dominio del cliente
3. Sigue las instrucciones de verificación DNS

---

## Gestión mensual del cliente

### Agregar o cambiar el email autorizado

1. Vercel → proyecto del cliente → **Settings → Environment Variables**
2. Edita `ALLOWED_EMAILS` → agrega el nuevo email separado por coma
3. **Redeploy**

### Si el cliente olvida su contraseña

El cliente puede hacer **"Forgot password"** en la pantalla de login — Clerk maneja el reset automáticamente por email.

### Si el cliente quiere agregar un colaborador (ej. secretaria)

1. Agrega el email de la secretaria a `ALLOWED_EMAILS` en Vercel (separado por coma)
2. Redeploy
3. La secretaria se registra → tú apruebas en el Waitlist de Clerk
4. Importante: la secretaria verá **los mismos datos** que el abogado (mismo `userId` no — en realidad cada usuario tiene su propio `userId` y sus propios datos). Si quieres que compartan datos, eso requiere una modificación al código (modo organización).

### Ver logs de errores

Vercel → tu proyecto → **Deployments → Functions** → ahí están los logs en tiempo real de cada API call.

### Actualizar la app con nuevas funciones

Cuando hay una nueva versión de LexCRM:
```bash
cd /ruta/del/repo
git pull origin claude/crm-chilean-lawyers-wnk6t5
git push origin main  # o la rama que Vercel sigue
```
Vercel redeploya automáticamente.

---

## Precios sugeridos (referencia)

| Plan | Incluye | Precio mensual sugerido |
|---|---|---|
| **Básico** | 1 usuario, sin IA | $15.000 – $25.000 CLP |
| **Pro** | 1 usuario + IA | $35.000 – $50.000 CLP |
| **Firma** | Hasta 3 usuarios + IA | $70.000 – $100.000 CLP |

Costos de infraestructura por cliente (aproximado): **$0 – $5 USD/mes** en niveles gratuitos de Vercel/Turso/Clerk para volúmenes bajos. La IA (Anthropic) es pago por uso (~$0.003 por resumen generado).

---

## Checklist de entrega a un cliente nuevo

- [ ] Base de datos Turso creada y en región correcta
- [ ] Instancia Clerk Production creada
- [ ] JWT token configurado con email
- [ ] Waitlist activado en Clerk
- [ ] Proyecto Vercel desplegado con todas las variables
- [ ] `ALLOWED_EMAILS` con el email del cliente
- [ ] Primer redeploy exitoso (verde en Vercel)
- [ ] Cliente registrado y aprobado en Waitlist
- [ ] Prueba de acceso con el cliente confirmada
- [ ] Dominio personalizado configurado *(si aplica)*
- [ ] Entrega del Manual de Usuario al cliente

---

## Solución de problemas frecuentes

| Problema | Causa probable | Solución |
|---|---|---|
| "Acceso no autorizado" al entrar | El email no está en `ALLOWED_EMAILS` | Verificar la variable en Vercel + Redeploy |
| La IA dice "no configurada" | Falta `ANTHROPIC_API_KEY` | Agregar en Vercel + Redeploy |
| El cliente no puede registrarse | Waitlist activo | Aprobar en Clerk → Users → Waitlist |
| Error 500 en la app | Variable de entorno faltante o Turso caído | Revisar logs en Vercel → Functions |
| El email del JWT no llega | JWT template no configurado en Clerk | Configure → Sessions → Customize session token |
