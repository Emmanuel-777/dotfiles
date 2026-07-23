// Shim de navegador para `undici`. El paquete @vercel/blob/client importa
// `fetch` desde undici (un cliente HTTP de Node que no corre en el navegador
// ni webpack puede empaquetar). En el bundle del cliente aliasamos undici a
// este shim, que reexporta el fetch global del navegador. En el servidor se
// sigue usando el undici real. Ver next.config.js.
export const fetch = (...args) => globalThis.fetch(...args)
export const Headers = globalThis.Headers
export const Request = globalThis.Request
export const Response = globalThis.Response
export const FormData = globalThis.FormData
export default { fetch, Headers, Request, Response, FormData }
