/**
 * Exportar a CSV para abrir en Excel.
 *
 * - Separador punto y coma (;): Excel en espanol usa la coma para decimales.
 * - Se agrega la marca BOM al inicio para que Excel lea bien las tildes.
 * - Los montos van como numeros enteros, sin puntos de miles, para poder sumarlos.
 */

const SEPARADOR = ';'
const BOM = '﻿'

/** Pone comillas si hace falta y duplica las comillas internas. */
export function celda(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return ''
  const texto = String(valor)
  return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function aCSV(filas: (string | number | null | undefined)[][]): string {
  return BOM + filas.map((f) => f.map(celda).join(SEPARADOR)).join('\r\n') + '\r\n'
}

// ---------------------------------------------------------------------------
// Datos de la app -> filas
// ---------------------------------------------------------------------------

type JugadaCSV = {
  tipo: 'jugada'
  orden: number
  numero: string
  juegoNombre: string
  vendido: number
  porcentaje: number
  ganancia: number
  neto: number
  premio: number
  nota: string
  bancaResultante: number
}
type MovimientoCSV = {
  tipo: 'movimiento'
  orden: number
  subtipo: 'entrega' | 'ingreso'
  monto: number
  nota: string
  bancaResultante: number
}
type DiaCSV = {
  fecha: string
  bancaInicial: number
  bancaFinal: number
  totalVendido: number
  totalGanancia: number
  totalPremios: number
  totalEntregas?: number
  totalIngresos?: number
  apuntes?: string
}

export const ENCABEZADO_DETALLE = [
  'Fecha',
  'Tipo',
  'Número',
  'Juego',
  'Vendido',
  '%',
  'Ganancia',
  'Neto',
  'Premio',
  'Entrega',
  'Ingreso',
  'Banca',
  'Nota',
]

/** Una fila por cada linea del dia (jugadas y movimientos), en orden. */
export function filasDetalle(dias: { dia: DiaCSV; registros: (JugadaCSV | MovimientoCSV)[] }[]) {
  const filas: (string | number)[][] = [ENCABEZADO_DETALLE]
  const ordenados = [...dias].sort((a, b) => a.dia.fecha.localeCompare(b.dia.fecha))
  for (const { dia, registros } of ordenados) {
    for (const r of [...registros].sort((a, b) => a.orden - b.orden)) {
      if (r.tipo === 'jugada') {
        filas.push([
          dia.fecha,
          'Jugada',
          r.numero,
          r.juegoNombre,
          r.vendido,
          r.porcentaje,
          r.ganancia,
          r.neto,
          r.premio,
          '',
          '',
          r.bancaResultante,
          r.nota,
        ])
      } else {
        filas.push([
          dia.fecha,
          r.subtipo === 'entrega' ? 'Entrega a dueños' : 'Ingreso',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          r.subtipo === 'entrega' ? r.monto : '',
          r.subtipo === 'ingreso' ? r.monto : '',
          r.bancaResultante,
          r.nota,
        ])
      }
    }
  }
  return filas
}

export const ENCABEZADO_DIAS = [
  'Fecha',
  'Banca inicial',
  'Vendido',
  'Ganancia',
  'Premios',
  'Entregas',
  'Ingresos',
  'Banca final',
  'Apuntes',
]

/** Una fila por dia con sus totales, y una fila final con la suma del periodo. */
export function filasDias(dias: DiaCSV[]) {
  const ordenados = [...dias].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const filas: (string | number)[][] = [ENCABEZADO_DIAS]
  const suma = { vendido: 0, ganancia: 0, premios: 0, entregas: 0, ingresos: 0 }
  for (const d of ordenados) {
    filas.push([
      d.fecha,
      d.bancaInicial,
      d.totalVendido,
      d.totalGanancia,
      d.totalPremios,
      d.totalEntregas ?? 0,
      d.totalIngresos ?? 0,
      d.bancaFinal,
      d.apuntes ?? '',
    ])
    suma.vendido += d.totalVendido
    suma.ganancia += d.totalGanancia
    suma.premios += d.totalPremios
    suma.entregas += d.totalEntregas ?? 0
    suma.ingresos += d.totalIngresos ?? 0
  }
  if (ordenados.length) {
    filas.push([
      'Total',
      ordenados[0].bancaInicial,
      suma.vendido,
      suma.ganancia,
      suma.premios,
      suma.entregas,
      suma.ingresos,
      ordenados[ordenados.length - 1].bancaFinal,
      '',
    ])
  }
  return filas
}
