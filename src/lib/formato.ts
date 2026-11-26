/**
 * Formato de montos: "₡ 96.188" (punto para los miles).
 *
 * No se usa Intl.NumberFormat('es-CR') porque separa los miles con espacio
 * ("96 188"), y en el cuaderno y la especificacion se usa punto.
 */

export const SIMBOLO_MONEDA = '₡'
let simboloActual = SIMBOLO_MONEDA

/** Cambia el simbolo de todos los montos (Ajustes generales). */
export function establecerSimbolo(simbolo: string | undefined) {
  simboloActual = simbolo?.trim() || SIMBOLO_MONEDA
}
const MENOS = '−' // signo menos tipografico (U+2212)

/** 96188 -> "96.188"; -40000 -> "−40.000" */
export function formatearNumero(n: number): string {
  const entero = Math.round(n)
  const absoluto = Math.abs(entero)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return entero < 0 ? `${MENOS}${absoluto}` : absoluto
}

/** 96188 -> "₡ 96.188"; -500 -> "−₡ 500" */
export function formatearMonto(n: number, simbolo: string = simboloActual): string {
  const entero = Math.round(n)
  const absoluto = formatearNumero(Math.abs(entero))
  return entero < 0 ? `${MENOS}${simbolo} ${absoluto}` : `${simbolo} ${absoluto}`
}

/** Siempre con signo: 585 -> "+585"; -13500 -> "−13.500"; 0 -> "0" */
export function formatearConSigno(n: number): string {
  const entero = Math.round(n)
  if (entero === 0) return '0'
  return entero > 0 ? `+${formatearNumero(entero)}` : formatearNumero(entero)
}

/** El texto empieza con signo menos ("-" o "−"), antes o despues del simbolo. */
function empiezaConMenos(texto: string): boolean {
  return /^[^\d]*[-−]/.test(texto)
}

/**
 * Convierte lo que escribe en un campo de monto a numero entero.
 * Ignora puntos, espacios y simbolos: "31.150" -> 31150, "" -> 0.
 * Respeta el signo menos: "−500" -> -500.
 */
export function parsearMonto(texto: string): number {
  const digitos = texto.replace(/\D/g, '')
  if (!digitos) return 0
  const n = Number.parseInt(digitos, 10)
  return empiezaConMenos(texto) && n !== 0 ? -n : n
}

/**
 * Mientras escribe: "31150" -> "31.150"; "" -> "".
 * Con permitirNegativo: "-500" -> "−500" y "-" se deja tal cual para seguir escribiendo.
 */
export function formatearMientrasEscribe(texto: string, permitirNegativo = false): string {
  const negativo = permitirNegativo && empiezaConMenos(texto)
  const digitos = texto.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  if (!digitos) return negativo ? MENOS : ''
  const n = Number.parseInt(digitos, 10)
  return negativo && n !== 0 ? `${MENOS}${formatearNumero(n)}` : formatearNumero(n)
}

/** Cambia el signo de lo escrito en un campo: "500" <-> "−500". */
export function cambiarSigno(texto: string): string {
  return empiezaConMenos(texto) ? texto.replace(/[-−]/, '') : `${MENOS}${texto}`
}

/**
 * Porcentaje: acepta coma o punto decimal. "6" -> 6, "6,5" -> 6.5.
 * Devuelve null si no es un numero valido entre 0 y 100.
 */
export function parsearPorcentaje(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (!limpio || !/^\d+(\.\d+)?$/.test(limpio)) return null
  const n = Number(limpio)
  return n >= 0 && n <= 100 ? n : null
}
