import { describe, expect, it } from 'vitest'
import {
  cambiarSigno,
  formatearConSigno,
  formatearMientrasEscribe,
  formatearMonto,
  formatearNumero,
  parsearMonto,
  parsearPorcentaje,
} from './formato'

describe('formato de montos', () => {
  it('usa punto para los miles', () => {
    expect(formatearNumero(96_188)).toBe('96.188')
    expect(formatearNumero(2_224)).toBe('2.224')
    expect(formatearNumero(1_000_000)).toBe('1.000.000')
    expect(formatearNumero(585)).toBe('585')
    expect(formatearNumero(0)).toBe('0')
  })

  it('agrega el simbolo de colones', () => {
    expect(formatearMonto(96_188)).toBe('₡ 96.188')
    expect(formatearMonto(-500)).toBe('−₡ 500')
  })

  it('muestra el signo para ganancias y premios', () => {
    expect(formatearConSigno(585)).toBe('+585')
    expect(formatearConSigno(-13_500)).toBe('−13.500')
    expect(formatearConSigno(0)).toBe('0')
  })
})

describe('campos de monto', () => {
  it('lee lo que escribe ignorando puntos', () => {
    expect(parsearMonto('31.150')).toBe(31_150)
    expect(parsearMonto('₡ 63 000')).toBe(63_000)
    expect(parsearMonto('')).toBe(0)
  })

  it('pone el separador de miles mientras escribe', () => {
    expect(formatearMientrasEscribe('31150')).toBe('31.150')
    expect(formatearMientrasEscribe('63.000' + '000')).toBe('63.000.000')
    expect(formatearMientrasEscribe('007')).toBe('7')
    expect(formatearMientrasEscribe('')).toBe('')
  })

  it('acepta negativos solo donde se permiten', () => {
    expect(parsearMonto('−500')).toBe(-500)
    expect(parsearMonto('-1.250')).toBe(-1_250)
    expect(parsearMonto('−₡ 500')).toBe(-500)
    expect(parsearMonto(formatearNumero(-40_000))).toBe(-40_000)
    expect(parsearMonto('−')).toBe(0)
    expect(formatearMientrasEscribe('-1250', true)).toBe('−1.250')
    expect(formatearMientrasEscribe('-', true)).toBe('−')
    expect(formatearMientrasEscribe('-1250')).toBe('1.250')
    expect(cambiarSigno('500')).toBe('−500')
    expect(cambiarSigno('−500')).toBe('500')
  })

  it('lee porcentajes con coma o punto', () => {
    expect(parsearPorcentaje('6')).toBe(6)
    expect(parsearPorcentaje('6,5')).toBe(6.5)
    expect(parsearPorcentaje('10.0')).toBe(10)
    expect(parsearPorcentaje('abc')).toBeNull()
    expect(parsearPorcentaje('150')).toBeNull()
    expect(parsearPorcentaje('')).toBeNull()
  })
})
