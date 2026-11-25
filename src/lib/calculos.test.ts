import { describe, expect, it } from 'vitest'
import {
  calcularDia,
  calcularGanancia,
  calcularGananciaAcumulada,
  calcularNeto,
  calcularRegistro,
  recalcularEnCadena,
  vistaPreviaBanca,
  type JugadaEntrada,
  type MovimientoEntrada,
  type RegistroEntrada,
} from './calculos'

type JugadaPrueba = JugadaEntrada & { numero: string; juego: string }

const jugada = (
  numero: string,
  juego: string,
  vendido: number,
  premio: number,
  porcentaje = 6,
): JugadaPrueba => ({ tipo: 'jugada', numero, juego, vendido, porcentaje, premio })

/** Cuaderno del 24 de noviembre (sistema-loteria.md, seccion 2.1). */
const BANCA_INICIAL_24_NOV = 100_523
const JUGADAS_24_NOV: JugadaPrueba[] = [
  jugada('98', 'Primera', 9_750, 13_500),
  jugada('24', 'Nica 11', 14_900, 27_000),
  jugada('27', 'Salvador', 6_050, 0),
  jugada('26B', 'Tica 1pm', 20_600, 27_000),
  jugada('77', 'Nica 3pm', 16_200, 0),
  jugada('29R', 'Tica 4pm', 18_800, 45_000),
  jugada('42', 'Primera', 8_700, 0),
  jugada('66', 'Tica 7pm', 31_150, 63_000),
  jugada('R', 'Tica 7pm (reventado)', 1_800, 0, 10),
  jugada('06', 'Nica 9pm', 42_700, 36_000),
  jugada('06', 'Salvador', 7_300, 54_000),
]

/** [ganancia, neto, banca] esperados por linea, copiados del cuaderno. */
const ESPERADO_24_NOV: [number, number, number][] = [
  [585, 9_165, 96_188],
  [894, 14_006, 83_194],
  [363, 5_687, 88_881],
  [1_236, 19_364, 81_245],
  [972, 15_228, 96_473],
  [1_128, 17_672, 69_145],
  [522, 8_178, 77_323],
  [1_869, 29_281, 43_604],
  [180, 1_620, 45_224],
  [2_562, 40_138, 49_362],
  [438, 6_862, 2_224],
]

describe('una jugada', () => {
  it('calcula la ganancia al 6% (#98 Primera)', () => {
    expect(calcularGanancia(9_750, 6)).toBe(585)
    expect(calcularNeto(9_750, 6)).toBe(9_165)
  })

  it('usa el % de la linea: reventado al 10%', () => {
    expect(calcularGanancia(1_800, 10)).toBe(180)
  })

  it('redondea la ganancia a colones enteros', () => {
    expect(calcularGanancia(1_010, 6)).toBe(61) // 60,6
    expect(calcularGanancia(1_025, 6)).toBe(62) // 61,5
    expect(calcularGanancia(1_005, 6)).toBe(60) // 60,3
    expect(calcularGanancia(1_234, 6.5)).toBe(80) // 80,21
  })

  it('calcula la banca nueva: anterior + neto - premio', () => {
    const r = calcularRegistro(jugada('98', 'Primera', 9_750, 13_500), 100_523)
    expect(r).toMatchObject({ ganancia: 585, neto: 9_165, bancaResultante: 96_188 })
  })

  it('conserva los demas campos del registro', () => {
    const r = calcularRegistro(jugada('26B', 'Tica 1pm', 20_600, 27_000), 88_881)
    expect(r.numero).toBe('26B')
    expect(r.juego).toBe('Tica 1pm')
  })
})

describe('24 de noviembre (datos reales del cuaderno)', () => {
  const dia = calcularDia(BANCA_INICIAL_24_NOV, JUGADAS_24_NOV)

  it.each(ESPERADO_24_NOV.map((e, i) => [i, JUGADAS_24_NOV[i].numero, JUGADAS_24_NOV[i].juego, ...e]))(
    'linea %i: #%s %s -> ganancia %i, neto %i, banca %i',
    (i, _numero, _juego, ganancia, neto, banca) => {
      expect(dia.registros[i as number]).toMatchObject({
        ganancia,
        neto,
        bancaResultante: banca,
      })
    },
  )

  it('la banca final da 2.224', () => {
    expect(dia.bancaFinal).toBe(2_224)
  })

  it('los totales del dia coinciden con el cuaderno', () => {
    expect(dia).toMatchObject({
      bancaInicial: 100_523,
      totalVendido: 177_950,
      totalGanancia: 10_749,
      totalPremios: 265_500,
      totalEntregas: 0,
      totalIngresos: 0,
      bancaFinal: 2_224,
    })
  })
})

describe('movimientos de banca', () => {
  it('una entrega de 40.000 con banca 140.523 deja 100.523', () => {
    const entrega: MovimientoEntrada = { tipo: 'movimiento', subtipo: 'entrega', monto: 40_000 }
    expect(calcularRegistro(entrega, 140_523).bancaResultante).toBe(100_523)
  })

  it('un ingreso suma a la banca', () => {
    const ingreso: MovimientoEntrada = { tipo: 'movimiento', subtipo: 'ingreso', monto: 50_000 }
    expect(calcularRegistro(ingreso, 2_224).bancaResultante).toBe(52_224)
  })

  it('los movimientos se mezclan en orden con las jugadas y suman en sus totales', () => {
    const registros: RegistroEntrada[] = [
      { tipo: 'movimiento', subtipo: 'entrega', monto: 40_000 },
      ...JUGADAS_24_NOV,
      { tipo: 'movimiento', subtipo: 'ingreso', monto: 10_000 },
    ]
    const dia = calcularDia(140_523, registros)
    expect(dia.registros[0].bancaResultante).toBe(100_523)
    expect(dia.registros[11].bancaResultante).toBe(2_224)
    expect(dia.bancaFinal).toBe(12_224)
    expect(dia.totalEntregas).toBe(40_000)
    expect(dia.totalIngresos).toBe(10_000)
    expect(dia.totalGanancia).toBe(10_749)
  })
})

describe('dia sin registros', () => {
  it('la banca final es la inicial', () => {
    const dia = calcularDia(2_224, [])
    expect(dia.bancaFinal).toBe(2_224)
    expect(dia.registros).toEqual([])
    expect(dia.totalGanancia).toBe(0)
  })
})

describe('editar y borrar recalcula las lineas siguientes', () => {
  it('cambiar el premio de una linea intermedia mueve todas las bancas siguientes', () => {
    // #77 Nica 3pm (indice 4): de 0 a 18.000 de premio
    const editadas = JUGADAS_24_NOV.map((j, i) => (i === 4 ? { ...j, premio: 18_000 } : j))
    const dia = calcularDia(BANCA_INICIAL_24_NOV, editadas)

    // Las anteriores no cambian
    for (let i = 0; i < 4; i++) {
      expect(dia.registros[i].bancaResultante).toBe(ESPERADO_24_NOV[i][2])
    }
    // Desde la editada, todas bajan 18.000
    for (let i = 4; i < editadas.length; i++) {
      expect(dia.registros[i].bancaResultante).toBe(ESPERADO_24_NOV[i][2] - 18_000)
    }
    expect(dia.bancaFinal).toBe(2_224 - 18_000)
    expect(dia.totalPremios).toBe(265_500 + 18_000)
  })

  it('cambiar el vendido recalcula ganancia, neto y bancas', () => {
    // #98 Primera: de 9.750 a 10.000 -> ganancia 600, neto 9.400 (+235)
    const editadas = JUGADAS_24_NOV.map((j, i) => (i === 0 ? { ...j, vendido: 10_000 } : j))
    const dia = calcularDia(BANCA_INICIAL_24_NOV, editadas)
    expect(dia.registros[0]).toMatchObject({ ganancia: 600, neto: 9_400, bancaResultante: 96_423 })
    expect(dia.bancaFinal).toBe(2_224 + 235)
    expect(dia.totalGanancia).toBe(10_749 + 15)
  })

  it('borrar una linea recalcula las siguientes', () => {
    // Sin #66 Tica 7pm (indice 7): efecto -33.719 deja de restar
    const sinLinea = JUGADAS_24_NOV.filter((_, i) => i !== 7)
    const dia = calcularDia(BANCA_INICIAL_24_NOV, sinLinea)
    expect(dia.registros[6].bancaResultante).toBe(77_323)
    expect(dia.registros[7].bancaResultante).toBe(78_943) // reventado: 77.323 + 1.620
    expect(dia.bancaFinal).toBe(2_224 + 33_719)
  })
})

describe('recalculo en cadena entre dias', () => {
  const dias = [
    { fecha: '2026-11-24', bancaInicial: BANCA_INICIAL_24_NOV, registros: JUGADAS_24_NOV },
    {
      fecha: '2026-11-25',
      bancaInicial: 0, // se ignora: hereda la banca final del 24
      registros: [jugada('11', 'Primera', 10_000, 0)],
    },
    { fecha: '2026-11-26', bancaInicial: 0, registros: [] },
  ]

  it('la banca inicial del dia siguiente es la banca final del anterior', () => {
    const { dias: r, bancaActual } = recalcularEnCadena(dias)
    expect(r[0].bancaFinal).toBe(2_224)
    expect(r[1].bancaInicial).toBe(2_224)
    expect(r[1].bancaFinal).toBe(2_224 + 9_400)
    expect(r[2].bancaInicial).toBe(11_624)
    expect(r[2].bancaFinal).toBe(11_624)
    expect(bancaActual).toBe(11_624)
  })

  it('ordena los dias por fecha aunque lleguen desordenados', () => {
    const { dias: r, bancaActual } = recalcularEnCadena([dias[2], dias[0], dias[1]])
    expect(r.map((d) => d.fecha)).toEqual(['2026-11-24', '2026-11-25', '2026-11-26'])
    expect(bancaActual).toBe(11_624)
  })

  it('editar un dia anterior pasa el cambio hasta hoy', () => {
    const editado = {
      ...dias[0],
      registros: JUGADAS_24_NOV.map((j, i) => (i === 10 ? { ...j, premio: 0 } : j)),
    }
    const { dias: r, bancaActual } = recalcularEnCadena([editado, dias[1], dias[2]])
    expect(r[0].bancaFinal).toBe(2_224 + 54_000)
    expect(r[1].bancaInicial).toBe(56_224)
    expect(r[2].bancaInicial).toBe(65_624)
    expect(bancaActual).toBe(65_624)
  })

  it('sin dias no hay banca actual', () => {
    expect(recalcularEnCadena([]).bancaActual).toBeNull()
  })
})

describe('vista previa y ganancia acumulada', () => {
  it('muestra como queda la banca antes de guardar (#66 Tica 7pm)', () => {
    expect(vistaPreviaBanca(77_323, jugada('66', 'Tica 7pm', 31_150, 63_000))).toBe(43_604)
  })

  it('acumulado = inicial + ganancias - cobros', () => {
    expect(calcularGananciaAcumulada(11_000, [10_749], [])).toBe(21_749)
    expect(calcularGananciaAcumulada(21_749, [5_000], [20_000])).toBe(6_749)
  })
})
