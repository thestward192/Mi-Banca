import { describe, expect, it } from 'vitest'
import {
  etiquetaPeriodo,
  moverPeriodo,
  rangoPeriodo,
  sumarDias,
  totalesPeriodo,
  totalesPorMes,
} from './periodos'
import { esFechaISO, fechaConAnio } from './fecha'

describe('rangos', () => {
  it('la semana va de lunes a domingo', () => {
    // 25 Nov 2026 es miercoles
    expect(rangoPeriodo('semana', '2026-11-25')).toEqual({ desde: '2026-11-23', hasta: '2026-11-29' })
    // un domingo pertenece a la semana que empezo el lunes anterior
    expect(rangoPeriodo('semana', '2026-11-29')).toEqual({ desde: '2026-11-23', hasta: '2026-11-29' })
    expect(rangoPeriodo('semana', '2026-11-23')).toEqual({ desde: '2026-11-23', hasta: '2026-11-29' })
  })

  it('el mes llega hasta su ultimo dia (incluye bisiestos)', () => {
    expect(rangoPeriodo('mes', '2026-11-25')).toEqual({ desde: '2026-11-01', hasta: '2026-11-30' })
    expect(rangoPeriodo('mes', '2028-02-10')).toEqual({ desde: '2028-02-01', hasta: '2028-02-29' })
    expect(rangoPeriodo('mes', '2026-02-10')).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' })
  })

  it('el ano va del 1 de enero al 31 de diciembre', () => {
    expect(rangoPeriodo('anio', '2026-11-25')).toEqual({ desde: '2026-01-01', hasta: '2026-12-31' })
  })
})

describe('moverse entre periodos', () => {
  it('semanas, cruzando el cambio de ano', () => {
    expect(moverPeriodo('semana', '2026-11-25', -1)).toBe('2026-11-16')
    expect(rangoPeriodo('semana', moverPeriodo('semana', '2026-12-30', 1))).toEqual({
      desde: '2027-01-04',
      hasta: '2027-01-10',
    })
  })

  it('meses, cruzando el cambio de ano', () => {
    expect(moverPeriodo('mes', '2026-11-25', 1)).toBe('2026-12-01')
    expect(moverPeriodo('mes', '2026-12-25', 1)).toBe('2027-01-01')
    expect(moverPeriodo('mes', '2026-01-15', -1)).toBe('2025-12-01')
  })

  it('anos', () => {
    expect(moverPeriodo('anio', '2026-11-25', -1)).toBe('2025-01-01')
  })

  it('sumar dias cruza meses', () => {
    expect(sumarDias('2026-11-30', 1)).toBe('2026-12-01')
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('etiquetas', () => {
  it('en espanol y cortas', () => {
    expect(etiquetaPeriodo('semana', rangoPeriodo('semana', '2026-11-25'))).toBe('23 – 29 Nov 2026')
    expect(etiquetaPeriodo('semana', { desde: '2026-11-30', hasta: '2026-12-06' })).toBe(
      '30 Nov – 6 Dic 2026',
    )
    expect(etiquetaPeriodo('semana', { desde: '2025-12-29', hasta: '2026-01-04' })).toBe(
      '29 Dic 2025 – 4 Ene 2026',
    )
    expect(etiquetaPeriodo('mes', rangoPeriodo('mes', '2026-11-25'))).toBe('Noviembre 2026')
    expect(etiquetaPeriodo('anio', rangoPeriodo('anio', '2026-11-25'))).toBe('2026')
  })

  it('fecha con ano solo si es de otro ano', () => {
    expect(fechaConAnio('2026-11-24', '2026')).toBe('Mar 24 Nov')
    expect(fechaConAnio('2025-12-29', '2026')).toBe('Lun 29 Dic 2025')
  })

  it('valida fechas', () => {
    expect(esFechaISO('2026-11-24')).toBe(true)
    expect(esFechaISO('2026-02-30')).toBe(false)
    expect(esFechaISO('hoy')).toBe(false)
    expect(esFechaISO(undefined)).toBe(false)
  })
})

describe('totales del periodo', () => {
  const dia = (fecha: string, ini: number, fin: number, vendido: number, ganancia: number, premios: number) => ({
    fecha,
    bancaInicial: ini,
    bancaFinal: fin,
    totalVendido: vendido,
    totalGanancia: ganancia,
    totalPremios: premios,
    totalEntregas: 0,
    totalIngresos: 0,
  })

  const dias = [
    dia('2026-11-25', 2_224, 11_624, 10_000, 600, 0),
    dia('2026-11-24', 100_523, 2_224, 177_950, 10_749, 265_500),
    dia('2026-10-31', 90_000, 100_523, 5_000, 300, 0),
  ]

  it('suma y toma la banca del primer y ultimo dia', () => {
    expect(totalesPeriodo(dias)).toEqual({
      dias: 3,
      vendido: 192_950,
      ganancia: 11_649,
      premios: 265_500,
      entregas: 0,
      ingresos: 0,
      bancaInicial: 90_000,
      bancaFinal: 11_624,
    })
  })

  it('sin dias todo es cero y no hay banca', () => {
    expect(totalesPeriodo([])).toMatchObject({ dias: 0, ganancia: 0, bancaInicial: null, bancaFinal: null })
  })

  it('agrupa por mes para el resumen del ano', () => {
    const meses = totalesPorMes(dias)
    expect(meses.map((m) => [m.mes, m.ganancia, m.dias])).toEqual([
      ['2026-10', 300, 1],
      ['2026-11', 11_349, 2],
    ])
  })
})
