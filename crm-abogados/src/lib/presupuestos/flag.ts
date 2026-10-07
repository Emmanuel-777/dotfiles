/**
 * Módulo Presupuestos apagado por defecto: sin FEATURE_PRESUPUESTOS=true las
 * rutas del módulo responden 404 y el menú no lo muestra, o sea el CRM se
 * comporta exactamente como antes.
 */
export function presupuestosHabilitados(): boolean {
  return process.env.FEATURE_PRESUPUESTOS === 'true'
}
