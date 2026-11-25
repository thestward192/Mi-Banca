import { describe, expect, it } from 'vitest'
import { aCSV, celda, filasDetalle, filasDias } from './csv'

describe('celdas', () => {
  it('pone comillas solo cuando hace falta', () => {
    expect(celda('Primera')).toBe('Primera')
    expect(celda(9750)).toBe('9750')
    expect(celda('Chelo; 23400')).toBe('"Chelo; 23400"')
    expect(celda('dijo "hola"')).toBe('"dijo ""hola"""')
    expect(celda('dos\nlineas')).toBe('"dos\nlineas"')
    expect(celda(null)).toBe('')
  })

  it('el archivo empieza con BOM, usa ; y termina cada linea con CRLF', () => {
    const texto = aCSV([
      ['Fecha', 'Juego'],
      ['2026-11-24', 'Tica 7pm'],
    ])
    expect(texto).toBe('﻿Fecha;Juego\r\n2026-11-24;Tica 7pm\r\n')
  })
})

describe('filas de la app', () => {
  const dia24 = {
    fecha: '2026-11-24',
    bancaInicial: 140_523,
    bancaFinal: 96_188,
    totalVendido: 9_750,
    totalGanancia: 585,
    totalPremios: 13_500,
    totalEntregas: 40_000,
    totalIngresos: 0,
    apuntes: 'Chelo 23400',
  }

  it('detalle: jugadas y movimientos en orden, con montos sin puntos', () => {
    const filas = filasDetalle([
      {
        dia: dia24,
        registros: [
          {
            tipo: 'jugada',
            orden: 2,
            numero: '98',
            juegoNombre: 'Primera',
            vendido: 9_750,
            porcentaje: 6,
            ganancia: 585,
            neto: 9_165,
            premio: 13_500,
            nota: '',
            bancaResultante: 96_188,
          },
          {
            tipo: 'movimiento',
            orden: 1,
            subtipo: 'entrega',
            monto: 40_000,
            nota: 'Entregado a don X',
            bancaResultante: 100_523,
          },
        ],
      },
    ])
    expect(filas[1]).toEqual(['2026-11-24', 'Entrega a dueños', '', '', '', '', '', '', '', 40_000, '', 100_523, 'Entregado a don X'])
    expect(filas[2]).toEqual(['2026-11-24', 'Jugada', '98', 'Primera', 9_750, 6, 585, 9_165, 13_500, '', '', 96_188, ''])
  })

  it('dias: una fila por dia y el total al final', () => {
    const dia25 = { ...dia24, fecha: '2026-11-25', bancaInicial: 96_188, bancaFinal: 105_588, totalVendido: 10_000, totalGanancia: 600, totalPremios: 0, totalEntregas: 0, apuntes: '' }
    const filas = filasDias([dia25, dia24])
    expect(filas.map((f) => f[0])).toEqual(['Fecha', '2026-11-24', '2026-11-25', 'Total'])
    expect(filas[3]).toEqual(['Total', 140_523, 19_750, 1_185, 13_500, 40_000, 0, 105_588, ''])
  })

  it('sin dias solo queda el encabezado', () => {
    expect(filasDias([])).toHaveLength(1)
  })
})
