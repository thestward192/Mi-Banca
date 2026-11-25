/**
 * Periodos para el Resumen: semana (lunes a domingo), mes y ano.
 * Todo trabaja con fechas "AAAA-MM-DD" como texto, sin horas ni zonas horarias.
 */
import { MESES, MESES_LARGOS } from './fecha'

export type TipoPeriodo = 'semana' | 'mes' | 'anio'
export type Rango = { desde: string; hasta: string }

const aFecha = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}
const aISO = (f: Date) => f.toISOString().slice(0, 10)

export function sumarDias(iso: string, dias: number): string {
  const f = aFecha(iso)
  f.setUTCDate(f.getUTCDate() + dias)
  return aISO(f)
}

function ultimoDiaDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate() // mes 1-12
}

/** Rango del periodo que contiene la fecha ancla. */
export function rangoPeriodo(tipo: TipoPeriodo, ancla: string): Rango {
  const [a, m] = ancla.split('-').map(Number)
  if (tipo === 'semana') {
    const desplazamiento = (aFecha(ancla).getUTCDay() + 6) % 7 // lunes = 0
    const desde = sumarDias(ancla, -desplazamiento)
    return { desde, hasta: sumarDias(desde, 6) }
  }
  if (tipo === 'mes') {
    const mm = String(m).padStart(2, '0')
    return { desde: `${a}-${mm}-01`, hasta: `${a}-${mm}-${ultimoDiaDelMes(a, m)}` }
  }
  return { desde: `${a}-01-01`, hasta: `${a}-12-31` }
}

/** Fecha ancla del periodo anterior (-1) o siguiente (+1). */
export function moverPeriodo(tipo: TipoPeriodo, ancla: string, pasos: number): string {
  const [a, m] = ancla.split('-').map(Number)
  if (tipo === 'semana') return sumarDias(rangoPeriodo('semana', ancla).desde, 7 * pasos)
  if (tipo === 'mes') {
    const indice = a * 12 + (m - 1) + pasos
    return `${Math.floor(indice / 12)}-${String((indice % 12) + 1).padStart(2, '0')}-01`
  }
  return `${a + pasos}-01-01`
}

/** "23 – 29 Nov 2026", "29 Dic 2025 – 4 Ene 2026", "Noviembre 2026", "2026". */
export function etiquetaPeriodo(tipo: TipoPeriodo, { desde, hasta }: Rango): string {
  const [a1, m1, d1] = desde.split('-').map(Number)
  const [a2, m2, d2] = hasta.split('-').map(Number)
  if (tipo === 'anio') return String(a1)
  if (tipo === 'mes') return `${MESES_LARGOS[m1 - 1]} ${a1}`
  if (a1 !== a2) return `${d1} ${MESES[m1 - 1]} ${a1} – ${d2} ${MESES[m2 - 1]} ${a2}`
  if (m1 !== m2) return `${d1} ${MESES[m1 - 1]} – ${d2} ${MESES[m2 - 1]} ${a2}`
  return `${d1} – ${d2} ${MESES[m2 - 1]} ${a2}`
}

export function nombreMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number)
  return `${MESES_LARGOS[m - 1]} ${a}`
}

// ---------------------------------------------------------------------------
// Totales
// ---------------------------------------------------------------------------

type DiaConTotales = {
  fecha: string
  bancaInicial: number
  bancaFinal: number
  totalVendido: number
  totalGanancia: number
  totalPremios: number
  totalEntregas?: number
  totalIngresos?: number
}

export type TotalesPeriodo = {
  dias: number
  vendido: number
  ganancia: number
  premios: number
  entregas: number
  ingresos: number
  /** Banca al empezar el primer dia y al cerrar el ultimo (null si no hay dias). */
  bancaInicial: number | null
  bancaFinal: number | null
}

export function totalesPeriodo(dias: readonly DiaConTotales[]): TotalesPeriodo {
  const ordenados = [...dias].sort((x, y) => x.fecha.localeCompare(y.fecha))
  const t: TotalesPeriodo = {
    dias: ordenados.length,
    vendido: 0,
    ganancia: 0,
    premios: 0,
    entregas: 0,
    ingresos: 0,
    bancaInicial: ordenados[0]?.bancaInicial ?? null,
    bancaFinal: ordenados[ordenados.length - 1]?.bancaFinal ?? null,
  }
  for (const d of ordenados) {
    t.vendido += d.totalVendido
    t.ganancia += d.totalGanancia
    t.premios += d.totalPremios
    t.entregas += d.totalEntregas ?? 0
    t.ingresos += d.totalIngresos ?? 0
  }
  return t
}

/** Agrupa los dias por mes ("AAAA-MM"), en orden. Para el resumen del ano. */
export function totalesPorMes(dias: readonly DiaConTotales[]): (TotalesPeriodo & { mes: string })[] {
  const grupos = new Map<string, DiaConTotales[]>()
  for (const d of dias) {
    const mes = d.fecha.slice(0, 7)
    grupos.set(mes, [...(grupos.get(mes) ?? []), d])
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, lista]) => ({ mes, ...totalesPeriodo(lista) }))
}
