/**
 * Logica de calculo de la banca (sistema-loteria.md, secciones 2 y 5.2).
 *
 * Todo son funciones puras: reciben datos y devuelven datos nuevos, sin tocar
 * Firestore. Asi se pueden probar con los numeros reales del cuaderno.
 *
 * Montos en colones enteros. La ganancia se redondea con Math.round.
 */

export type SubtipoMovimiento = 'entrega' | 'ingreso'

/** Datos que escribe ella en una jugada. Ganancia y neto se calculan. */
export type JugadaEntrada = {
  tipo: 'jugada'
  vendido: number
  porcentaje: number
  premio: number
}

/** Entrega a duenos (resta) o ingreso (suma). */
export type MovimientoEntrada = {
  tipo: 'movimiento'
  subtipo: SubtipoMovimiento
  monto: number
}

export type RegistroEntrada = JugadaEntrada | MovimientoEntrada

export type JugadaCalculada<T extends JugadaEntrada = JugadaEntrada> = T & {
  ganancia: number
  neto: number
  bancaResultante: number
}

export type MovimientoCalculado<T extends MovimientoEntrada = MovimientoEntrada> = T & {
  bancaResultante: number
}

/** Resultado de calcular un registro, conservando los demas campos que traiga (id, numero, nota...). */
export type RegistroCalculado<T extends RegistroEntrada> = T extends JugadaEntrada
  ? JugadaCalculada<T>
  : T extends MovimientoEntrada
    ? MovimientoCalculado<T>
    : never

export type TotalesDia = {
  bancaInicial: number
  bancaFinal: number
  totalVendido: number
  totalGanancia: number
  totalPremios: number
  totalEntregas: number
  totalIngresos: number
}

export type DiaCalculado<T extends RegistroEntrada> = TotalesDia & {
  registros: RegistroCalculado<T>[]
}

// ---------------------------------------------------------------------------
// Una jugada
// ---------------------------------------------------------------------------

/** vendido x % del juego, redondeado a colones enteros. 9750 al 6% = 585. */
export function calcularGanancia(vendido: number, porcentaje: number): number {
  // toFixed evita errores de coma flotante (p. ej. 0.49999999 en lugar de 0.5).
  return Math.round(Number(((vendido * porcentaje) / 100).toFixed(6)))
}

/** vendido - ganancia. 9750 - 585 = 9165. */
export function calcularNeto(vendido: number, porcentaje: number): number {
  return vendido - calcularGanancia(vendido, porcentaje)
}

/** Cuanto cambia la banca con un registro (positivo suma, negativo resta). */
export function efectoEnBanca(registro: RegistroEntrada): number {
  if (registro.tipo === 'jugada') {
    return calcularNeto(registro.vendido, registro.porcentaje) - registro.premio
  }
  return registro.subtipo === 'entrega' ? -registro.monto : registro.monto
}

/** banca anterior + neto - premio (jugada) o +/- monto (movimiento). */
export function calcularRegistro<T extends RegistroEntrada>(
  registro: T,
  bancaAnterior: number,
): RegistroCalculado<T> {
  const bancaResultante = bancaAnterior + efectoEnBanca(registro)
  if (registro.tipo === 'jugada') {
    const ganancia = calcularGanancia(registro.vendido, registro.porcentaje)
    return {
      ...registro,
      ganancia,
      neto: registro.vendido - ganancia,
      bancaResultante,
    } as RegistroCalculado<T>
  }
  return { ...registro, bancaResultante } as RegistroCalculado<T>
}

// ---------------------------------------------------------------------------
// Un dia
// ---------------------------------------------------------------------------

/**
 * Recalcula todas las lineas de un dia, en el orden recibido.
 * La banca se arrastra linea por linea, empezando por bancaInicial.
 */
export function calcularDia<T extends RegistroEntrada>(
  bancaInicial: number,
  registros: readonly T[],
): DiaCalculado<T> {
  const resultado: RegistroCalculado<T>[] = []
  const totales: TotalesDia = {
    bancaInicial,
    bancaFinal: bancaInicial,
    totalVendido: 0,
    totalGanancia: 0,
    totalPremios: 0,
    totalEntregas: 0,
    totalIngresos: 0,
  }

  let banca = bancaInicial
  for (const registro of registros) {
    const calculado = calcularRegistro(registro, banca)
    banca = calculado.bancaResultante
    resultado.push(calculado)

    if (calculado.tipo === 'jugada') {
      const j = calculado as JugadaCalculada
      totales.totalVendido += j.vendido
      totales.totalGanancia += j.ganancia
      totales.totalPremios += j.premio
    } else if (calculado.subtipo === 'entrega') {
      totales.totalEntregas += calculado.monto
    } else {
      totales.totalIngresos += calculado.monto
    }
  }
  totales.bancaFinal = banca

  return { ...totales, registros: resultado }
}

/** Banca que quedaria si se agrega un registro al final (vista previa en vivo). */
export function vistaPreviaBanca(bancaActual: number, registro: RegistroEntrada): number {
  return bancaActual + efectoEnBanca(registro)
}

// ---------------------------------------------------------------------------
// Varios dias (recalculo en cadena)
// ---------------------------------------------------------------------------

export type DiaEntrada<T extends RegistroEntrada = RegistroEntrada> = {
  fecha: string // AAAA-MM-DD
  bancaInicial: number
  registros: readonly T[]
}

export type DiaEnCadena<T extends RegistroEntrada> = DiaCalculado<T> & { fecha: string }

/**
 * Recalcula una serie de dias en cadena: la banca final de cada dia pasa a ser
 * la banca inicial del siguiente.
 *
 * - Los dias se ordenan por fecha.
 * - El primer dia conserva su propia bancaInicial (es el dia que se edito, o
 *   el primero de la historia). Los demas la heredan del dia anterior.
 * - bancaActual = banca final del ultimo dia (va a config.bancaActual).
 *
 * Para editar un dia anterior, pasar ese dia y todos los que le siguen.
 */
export function recalcularEnCadena<T extends RegistroEntrada>(
  dias: readonly DiaEntrada<T>[],
): { dias: DiaEnCadena<T>[]; bancaActual: number | null } {
  const ordenados = [...dias].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const resultado: DiaEnCadena<T>[] = []

  let bancaAnterior: number | null = null
  for (const dia of ordenados) {
    const inicial: number = bancaAnterior ?? dia.bancaInicial
    const calculado = calcularDia(inicial, dia.registros)
    resultado.push({ fecha: dia.fecha, ...calculado })
    bancaAnterior = calculado.bancaFinal
  }

  return { dias: resultado, bancaActual: bancaAnterior }
}

// ---------------------------------------------------------------------------
// Ganancia acumulada
// ---------------------------------------------------------------------------

/**
 * Lo que lleva acumulado desde el ultimo cobro:
 * acumulado anterior + ganancia de hoy - cobros. Los cobros no tocan la banca.
 */
export function calcularGananciaAcumulada(
  acumuladoInicial: number,
  gananciasDias: readonly number[],
  cobros: readonly number[],
): number {
  const suma = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0)
  return acumuladoInicial + suma(gananciasDias) - suma(cobros)
}
