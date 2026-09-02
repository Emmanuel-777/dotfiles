# Landing Page — Yocelyn Cea

Sitio estático (HTML + CSS + JavaScript, sin dependencias ni compilación). Se sube tal cual al
hosting: no requiere Node, npm, WordPress ni base de datos.

## Contenido

```
web/
├── index.html                  Landing completa
├── politica-de-privacidad.html Requisito para Google Ads y Meta Ads
└── img/                        Imágenes optimizadas, logo y favicon
```

El logo, el favicon y el ícono para iPhone ya están integrados. Las demás versiones del
monograma (navy para fondos claros, blanco hueso, lineal y ornamental) quedaron guardadas en
`MARCA_YOCELYN/logo/`, junto con los archivos originales.

## Antes de publicar: tres cosas por reemplazar

Todas están en `index.html` y se encuentran buscando el texto indicado.

| Qué | Dónde buscar | Qué hacer |
|---|---|---|
| Formulario de charlas | `id="formLink"` | Cambiar el `href="#contacto"` por la URL del Google Form de inscripción. |
| Medición de Google | `var GA4_ID` y `var ADS_ID` | Pegar los identificadores entre comillas cuando estén creadas las cuentas (ej. `'G-XXXXXXXXXX'`). |
| Meta Pixel | `var PIXEL_ID` | Pegar el identificador del píxel entre comillas. |


Mientras los identificadores de medición estén vacíos, no se carga ningún rastreador: la página
funciona igual y el aviso de cookies sigue apareciendo sin activar nada.

## Subir el sitio a Hostinger

1. Entrar al panel de Hostinger → **Administrador de archivos** (o conectarse por FTP).
2. Abrir la carpeta `public_html` y borrar el archivo `default.php` o `index.html` de ejemplo.
3. Arrastrar los tres elementos: `index.html`, `politica-de-privacidad.html` y la carpeta `img`
   completa. La estructura dentro de `public_html` debe quedar idéntica a la de arriba.
4. Verificar que el sitio abra en el dominio y que las imágenes se vean.

## El archivo `.htaccess`

La carpeta incluye un `.htaccess`. **Súbelo junto con el resto** — es un archivo oculto, así que
en el administrador de archivos puede que tengas que activar "mostrar archivos ocultos" para
verlo. Sin él, Hostinger sigue sirviendo la versión antigua de la página durante horas después
de cada actualización, y uno cree que los cambios no se aplicaron.

## Si la publicas en Cloudflare Pages (vista previa)

El `.htaccess` es un archivo de Apache y **Cloudflare Pages lo ignora por completo**. No estorba
ni rompe nada, simplemente no hace nada ahí: recién empieza a servir cuando el sitio se mude a
Hostinger. No pierdas tiempo revisándolo si algo no funciona en Cloudflare.

## Importante al pasar a producción

La carpeta incluye un `robots.txt` que **impide que Google indexe el sitio**. Está ahí a
propósito, para que la vista previa gratuita no compita después con el dominio real.
**Al publicar en `yocelyncea.cl`, borrar ese archivo**; si no, el sitio nunca aparecerá en las
búsquedas.

## Dominio

1. Comprar o apuntar `yocelyncea.cl` (recomendado en la propuesta de Etapa 2).
2. Si el dominio se compró fuera de Hostinger, cambiar los servidores DNS a los que indica el
   panel de Hostinger. La propagación puede tardar hasta 24 horas.
3. Activar el certificado SSL gratuito (Let's Encrypt) desde el panel, para que el sitio cargue
   con `https://`. Google Ads exige HTTPS.
4. Configurar la redirección de `yocelyncea.cl` a `www.yocelyncea.cl` (o al revés), para que
   exista una sola versión.

## Después de publicar

- Enviar la URL a Google Search Console para que el sitio se indexe.
- Revisar la página en un celular real, no solo en el computador.
- Probar el botón de WhatsApp: debe abrir el chat con el mensaje ya escrito.
- Actualizar el enlace de la biografía de Instagram para que apunte al sitio.

## Mantención

Cualquier cambio de texto se hace editando `index.html` con un editor de texto plano y volviendo
a subir el archivo. No hay panel de administración: es intencional, para que el hosting sea
barato y el sitio no requiera actualizaciones de seguridad.
