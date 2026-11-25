export const ZONA_HORARIA = 'America/Costa_Rica'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const MESES_LARGOS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/** Fecha de hoy en Costa Rica como "AAAA-MM-DD". */
export function hoyISO(ahora: Date = new Date()): string {
  // en-CA formatea como AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora)
}

/** true si el texto es una fecha valida "AAAA-MM-DD". */
export function esFechaISO(texto: string | undefined): texto is string {
  if (!texto || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false
  const [a, m, d] = texto.split('-').map(Number)
  const f = new Date(Date.UTC(a, m - 1, d))
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d
}

/** "2026-11-25" -> "Mié 25 Nov" */
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay()
  return `${DIAS[dia]} ${d} ${MESES[m - 1]}`
}

/** Igual que fechaCorta, pero agrega el ano si no es el de referencia: "Lun 29 Dic 2025". */
export function fechaConAnio(iso: string, anioReferencia: string): string {
  return iso.slice(0, 4) === anioReferencia ? fechaCorta(iso) : `${fechaCorta(iso)} ${iso.slice(0, 4)}`
}
