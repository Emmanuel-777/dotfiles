import type { Moneda } from './calculo'

export interface EtapaInput {
  nombre: string
  descripcion: string
  honorarios: number
  abono: number
  cuotas: number
  opcional: boolean
  activada: boolean
  nota: string
}

export interface PlantillaPresupuesto {
  materia: string
  etapas: EtapaInput[]
  exito?: { activo: boolean; abono: number; pct: number }
  audienciaCercana?: boolean
}

const e = (
  nombre: string, descripcion: string, honorarios: number, abono: number, cuotas: number,
  opcional = false,
): EtapaInput => ({ nombre, descripcion, honorarios, abono, cuotas, opcional, activada: false, nota: '' })

// Montos de EJEMPLO: cada abogado los reemplaza por sus propios valores.
export const PLANTILLAS: Record<string, PlantillaPresupuesto> = {
  'Litigio por etapas': {
    materia: 'Representación en juicio',
    etapas: [
      e('Etapa 1: Estudio y demanda', 'Análisis de antecedentes, estrategia y presentación de la demanda.', 800000, 400000, 3),
      e('Etapa 2: Juicio de primera instancia', 'Representación en audiencias hasta la sentencia.', 1200000, 400000, 4),
      e('Etapa 3: Recursos', 'Solo si se presenta un recurso contra la sentencia.', 900000, 0, 1, true),
    ],
  },
  'Defensa penal por etapas': {
    materia: 'Defensa penal',
    etapas: [
      e('Etapa 1: Investigación', 'Desde la contratación hasta antes de la formalización.', 900000, 450000, 3),
      e('Etapa 2: Formalización', 'Desde la audiencia de formalización hasta el cierre de la investigación.', 900000, 450000, 3),
      e('Etapa 3A: Salida alternativa', 'Posterior al cierre de la investigación.', 300000, 0, 1, true),
      e('Etapa 3B: Procedimiento abreviado', 'Posterior al cierre de la investigación.', 900000, 0, 1, true),
      e('Etapa 3C: Juicio oral', 'Posterior al cierre de la investigación.', 1800000, 0, 1, true),
    ],
  },
  'Honorario a éxito': {
    materia: 'Cobro a éxito',
    etapas: [],
    exito: { activo: true, abono: 300000, pct: 20 },
  },
  'Pago único': {
    materia: 'Asesoría legal',
    etapas: [e('Honorarios totales', 'Servicios según el alcance acordado.', 1500000, 300000, 3)],
  },
  'Contrato o asesoría': {
    materia: 'Redacción y revisión de contrato',
    etapas: [
      e('Redacción', 'Levantamiento de necesidades y primera versión.', 400000, 200000, 1),
      e('Revisión y ajustes', 'Hasta dos rondas de cambios con la contraparte.', 250000, 0, 1),
    ],
  },
  'En blanco': { materia: '', etapas: [e('Honorarios', '', 0, 0, 1)] },
}

export const TEXTO_POR_QUE =
  'Atención directa y personalizada.\nEstrategia definida desde el inicio y comunicada con claridad.\nInformación oportuna sobre cada avance del caso.\nConfidencialidad y secreto profesional.'

export const TEXTO_GASTOS =
  'Los honorarios cubren solo los servicios jurídicos contratados. No incluyen, entre otros: honorarios de peritos e informes periciales; receptores judiciales y notificaciones especiales; derechos notariales, legalizaciones y copias autorizadas; certificados y traducciones; publicaciones; derechos de registros y conservadores; tasas administrativas; desplazamientos fuera de la ciudad; cualquier otro gasto necesario para tramitar el caso. Son de cargo del cliente y se informan previamente cuando corresponda.'

export const TEXTO_PAGO =
  'El abono se paga al aceptar la propuesta. Las cuotas son mensuales, por transferencia, con vencimiento cada 30 días desde el abono. Los datos bancarios se informarán por escrito al aceptar. Si el caso termina antes de pagar todas las cuotas, el saldo sigue siendo exigible, pues corresponde a servicios ya comprometidos.'

// Punto de partida: un abogado debe revisarlas antes de usarlas con clientes.
export const TEXTO_CLAUSULAS = [
  'Inicio de la prestación. Los servicios comienzan una vez aceptada esta propuesta, pagado el abono y firmado el mandato, si corresponde.',
  'Datos personales. Los datos del cliente se usan solo para la representación y se tratan conforme a la normativa de protección de datos aplicable, con medidas de seguridad razonables y resguardando el secreto profesional.',
  'Confidencialidad. El prestador mantendrá reserva de la información, salvo obligación legal o autorización del cliente.',
  'Colaboración del cliente. El cliente entregará información completa, veraz y oportuna.',
  'Obligación de medios. El prestador se obliga a emplear su mejor diligencia profesional y no garantiza un resultado.',
  'Terminación anticipada. Si el contrato termina antes de lo previsto, lo ya prestado no se devuelve, lo devengado sigue siendo exigible y lo futuro deja de prestarse.',
  'Incumplimiento de pago. El incumplimiento en el pago facultará al prestador a cobrar la pena que acuerden las partes, de monto razonable, conforme a la ley aplicable.',
  'Jurisdicción. Las controversias se someten a los tribunales competentes del domicilio del prestador.',
].join('\n')

export const MONEDAS: Moneda[] = ['CLP', 'UF']
