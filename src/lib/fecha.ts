export const ZONA_HORARIA = 'America/Costa_Rica'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

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

/** "2026-11-25" -> "Mié 25 Nov" */
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay()
  return `${DIAS[dia]} ${d} ${MESES[m - 1]}`
}
