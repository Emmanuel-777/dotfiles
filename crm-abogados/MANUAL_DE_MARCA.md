# Manual de Marca — LexCRM

Versión 1.0 — julio 2026

Este documento define cómo se usa la identidad visual de LexCRM: logo, colores, tipografía, tono de voz y aplicaciones. Todos los valores acá listados son los mismos tokens usados en el producto (`tailwind.config.js`, `src/components/LogoMark.tsx`), no una versión aparte "de diseño" — así el manual nunca se desincroniza del CRM real.

---

## 1. La marca en una frase

**LexCRM** es el sistema de gestión legal para abogados en Chile. La marca comunica **orden, confianza y tecnología aplicada al derecho** — nunca informalidad ni "startup genérica". El isotipo (escudo + red de nodos + flecha ascendente) resume esto: protección jurídica (escudo), gestión de casos interconectados (nodos) y crecimiento del estudio (flecha).

---

## 2. Logo

### 2.1 Versiones disponibles

Todos los archivos están en `crm-abogados/public/brand/`:

| Archivo | Uso |
|---|---|
| `lexcrm-isotipo-color.svg` / `-1024.png` | Isotipo solo (escudo), a color, fondo transparente. Favicon, avatar, redes sociales. |
| `lexcrm-isotipo-color-fondo-blanco-1024.png` | Igual, con fondo blanco sólido. Para plataformas que no soportan transparencia. |
| `lexcrm-isotipo-navy.svg` / `-1024.png` | Isotipo en un solo color (navy `#14254c`). Sellos, impresión a una tinta, marcas de agua. |
| `lexcrm-logotipo-color.svg` / `-1600.png` | Isotipo + wordmark "LexCRM", a color, fondo transparente. Uso por defecto en headers y documentos. |
| `lexcrm-logotipo-blanco.svg` / `-fondo-navy-1600.png` | Isotipo + wordmark en blanco. Para fondos oscuros o de color (navy, fotos). |

Regla simple: **sobre fondo claro usa la versión a color; sobre fondo oscuro o de color usa la versión blanca.** Nunca el logo a color sobre fondos de color — pierde contraste y el degradé se ve mal.

### 2.2 Construcción del isotipo

El escudo se dibuja en un lienzo cuadrado `viewBox="0 0 100 100"`, con:
- Contorno del escudo: trazo de 5px, esquinas redondeadas (`stroke-linejoin: round`).
- Red de nodos interna: trazos de 3.4px, terminaciones redondeadas (`stroke-linecap: round`).
- 5 nodos (círculos) de radio 4–5px marcando los puntos de la red.
- Una flecha ascendente hacia la esquina superior derecha, integrada en la red — nunca se dibuja aislada del resto.

No se debe redibujar el escudo a mano: siempre exportar desde `LogoMark.tsx` o los SVG de `public/brand/`.

### 2.3 Espacio de seguridad y tamaño mínimo

- Espacio libre mínimo alrededor del logo: **igual al ancho del escudo** (en el isotipo, mide desde el borde izquierdo del escudo hasta el borde derecho, y deja ese mismo espacio en los 4 lados).
- Tamaño mínimo de uso: **24px** de alto para el isotipo solo, **20px de alto** para el logotipo horizontal (por debajo de eso la red de nodos deja de leerse). En impresión, no bajar de 1.2 cm de alto.

### 2.4 Usos incorrectos

No hacer:
- No estirar ni deformar el escudo (mantener siempre proporción 1:1 en el isotipo).
- No rotar el logo.
- No aplicar el degradé de marca a otros elementos que no sean el logo.
- No poner el isotipo dentro de una forma adicional (círculo, cuadrado de color) — el escudo ya es la forma contenedora.
- No usar el logotipo a color sobre fotografías o fondos de color/degradé — usar la versión blanca.
- No cambiar el orden ni la tipografía del wordmark "LexCRM" (mayúscula inicial + "CRM" en mayúsculas, todo junto, sin espacio).

---

## 3. Color

Paleta derivada directamente del degradé del escudo (`#14254c → #1c47b8 → #3b7bf0`), definida en `tailwind.config.js` bajo `colors.blue` / `colors.primary` / `colors.navy`.

### 3.1 Colores primarios

| Nombre | Hex | Uso |
|---|---|---|
| **Royal** (primary-600 / blue-600) | `#2563eb` | Color de acción principal: botones primarios, links, foco de inputs, `colorPrimary` de Clerk. |
| **Navy profundo** (primary-900 / blue-900) | `#14254c` | Base del escudo, texto de marca sobre fondo claro, fondo de secciones oscuras. |
| **Azul medio** (blue-500) | `#3b7bf0` | Extremo claro del degradé, acentos, hover states. |

### 3.2 Degradé de marca

```
linear-gradient(135deg, #14254c 0%, #1c47b8 55%, #3b7bf0 100%)
```
Uso exclusivo para: el trazo del logo, encabezados hero de la landing y el dossier técnico, y CTAs destacados de alta jerarquía. No usarlo en textos largos ni en fondos de tablas — reservarlo para momentos de impacto.

### 3.3 Escala completa

| Token | Hex | Uso típico |
|---|---|---|
| blue-50 | `#eff5ff` | Fondos suaves, badges informativos |
| blue-100 | `#dae8ff` | Fondos de hover suave |
| blue-200 | `#b8d3ff` | Bordes suaves |
| blue-300 | `#8ab4ff` | Elementos deshabilitados en contexto de marca |
| blue-400 | `#5a90f5` | Iconografía secundaria |
| blue-500 | `#3b7bf0` | Acentos, extremo claro del degradé |
| blue-600 / primary-600 | `#2563eb` | **Acción primaria** (botones, links) |
| blue-700 / primary-700 | `#1c47b8` | Hover de botones primarios, punto medio del degradé |
| blue-800 / primary-800 | `#16336f` | Texto de marca sobre fondo claro, headers secundarios |
| blue-900 / primary-900 | `#14254c` | Navy profundo, base del escudo |
| navy-700 | `#16336f` | Fondos oscuros alternos |
| navy-800 | `#152a52` | Fondos oscuros alternos |
| navy-900 | `#0f1c36` | Fondo más oscuro (heroes tipo dossier/PDF institucional) |

### 3.4 Colores funcionales (estado, no de marca)

Se usan en el producto para comunicar estado, no identidad — no deben reemplazar al azul en piezas de marca:
- **Ámbar** (`amber-*` de Tailwind): alertas próximas a vencer, plazos y prescripciones penales por vencer.
- **Rojo** (`red-*`): vencidos, errores, eliminaciones.
- **Verde** (`emerald-*`/`green-*`): completado, pagado, éxito.
- **Slate** (`slate-*`): texto neutro, fondos de interfaz, bordes.

### 3.5 Contraste

El azul primario `#2563eb` sobre blanco cumple WCAG AA para texto grande y componentes UI. Para texto normal (body) usar `#14254c` (navy) o `slate-700`/`slate-800`, no el azul royal directo — el royal es para elementos interactivos, no para párrafos largos.

---

## 4. Tipografía

LexCRM no usa una tipografía custom cargada por `next/font`: se apoya en el **stack sans-serif nativo de Tailwind** (`font-sans`), que en cada sistema operativo renderiza con la fuente del sistema (San Francisco en macOS/iOS, Segoe UI en Windows, Roboto en Android, etc.):

```
ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

**Por qué:** rendimiento (cero peso de fuente descargada, cero layout shift) y consistencia con la plataforma del usuario. Es una decisión de producto, no una omisión — se mantiene así.

Para piezas fuera del producto (landing, dossier PDF, este manual) donde se necesita un logotipo tipográfico fijo (por ejemplo el wordmark del logo), se usa **Arial/Helvetica Bold** como tipografía de respaldo universal, ya que es la que se usó al construir el wordmark SVG.

### Jerarquía tipográfica (clases Tailwind reales usadas en el producto)

| Nivel | Clase | Uso |
|---|---|---|
| H1 / título de página | `text-2xl font-bold` (24px, 700) | Encabezados de página, títulos de módulo |
| H2 / sección | `text-xl font-semibold` (20px, 600) | Subtítulos de sección, cards principales |
| Cuerpo | `text-sm` (14px, 400) | Texto general de interfaz |
| Auxiliar / metadata | `text-xs text-slate-500` (12px, 400) | Fechas, ayudas, notas al pie de formulario |

---

## 5. Tono de voz

- **Directo y profesional**, sin jerga de marketing. LexCRM le habla a abogados, no a consumidores masivos.
- **En español de Chile**, formal pero no rígido (trato de "usted" implícito en textos legales, "tú" en la interacción de producto — ej. "Agrega tu primer cliente").
- **Preciso con lo legal**: cuando se menciona la Ley 21.719 u otra norma, se cita el artículo o número exacto; no se hacen afirmaciones legales vagas.
- **Honesto sobre límites del producto**: el dossier técnico y los manuales declaran explícitamente qué NO hace el sistema (ej. no hay multiusuario real todavía) en vez de sobrevender.

---

## 6. Aplicaciones

- **Favicon / ícono de app**: `lexcrm-isotipo-color.svg` (ya configurado en `layout.tsx` → `metadata.icons`).
- **Login / pantallas de autorización** (Clerk): `colorPrimary: '#2563eb'`.
- **Documentos PDF institucionales** (dossier inversionistas, manuales): fondo navy `#0f1c36`→`#14254c` en portada, isotipo blanco sobre ese fondo, cuerpo del documento en blanco con acentos azul royal.
- **Landing / WhatsApp / redes**: logotipo horizontal a color sobre fondo blanco; isotipo solo como foto de perfil/avatar.
- **Correcorreos transaccionales** (Resend): usar el logotipo horizontal a color en el header del email, máx. 140px de ancho.

---

## 7. Naming

- El nombre del producto es **LexCRM** (una palabra, "L" y "CRM" mayúsculas). No usar "Lex CRM" (con espacio), "LEXCRM" (todo mayúscula) ni "lexcrm" en textos de marca — solo en URLs y dominios (`lexcrm.site`, `app.lexcrm.site`), donde el minúscula es correcto por convención de dominios.
- El isotipo nunca lleva el texto "LexCRM" incorporado — para eso existe el logotipo horizontal como pieza separada.
