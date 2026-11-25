/**
 * Escrituras en Firestore.
 *
 * Todo lo que cambia la banca va en un writeBatch (no en una transaccion):
 * los batch funcionan sin conexion y se sincronizan despues, y los numeros
 * del dia, de cada linea y de la config se escriben juntos o no se escriben.
 *
 * No se espera (await) el commit: sin senal la promesa no termina hasta que
 * vuelve el internet, pero los cambios ya se ven en pantalla al instante.
 */
import {
  doc,
  increment,
  serverTimestamp,
  writeBatch,
  type FieldValue,
  type WriteBatch,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { calcularDia } from '@/lib/calculos'
import { colJuegos, refConfig, refDia, refJuego, refRegistro } from './refs'
import type { Config, Dia, Registro } from './tipos'

export const JUEGOS_INICIALES: { nombre: string; porcentaje: number }[] = [
  { nombre: 'Primera', porcentaje: 6 },
  { nombre: 'Nica 11am', porcentaje: 6 },
  { nombre: 'Nica 3pm', porcentaje: 6 },
  { nombre: 'Nica 9pm', porcentaje: 6 },
  { nombre: 'Tica 1pm', porcentaje: 6 },
  { nombre: 'Tica 4pm', porcentaje: 6 },
  { nombre: 'Tica 7pm', porcentaje: 6 },
  { nombre: 'Reventado Tica', porcentaje: 10 },
  { nombre: 'Salvador', porcentaje: 6 },
]

/** Confirma el batch en segundo plano y avisa solo si falla. */
function enviar(batch: WriteBatch) {
  batch.commit().catch((err) => {
    console.error(err)
    toast.error('No se pudo guardar. Revisa la conexión y vuelve a probar')
  })
}

/** Primera vez: crea la configuracion y los juegos sugeridos. */
export function inicializarCuenta(uid: string) {
  const batch = writeBatch(db)
  const config: Config = {
    porcentajeDefault: 6,
    bancaActual: 0,
    gananciaAcumulada: 0,
    confirmarBorrar: true,
    juegosIniciados: true,
  }
  batch.set(refConfig(uid), config)
  JUEGOS_INICIALES.forEach((j, i) => {
    batch.set(doc(colJuegos(uid)), { ...j, activo: true, orden: i + 1, usos: 0 })
  })
  enviar(batch)
}

/** Crea el dia con la banca actual como banca inicial. */
export function crearDia(uid: string, fecha: string, config: Config) {
  const dia: Dia = {
    fecha,
    bancaInicial: config.bancaActual,
    bancaFinal: config.bancaActual,
    totalVendido: 0,
    totalGanancia: 0,
    totalPremios: 0,
    totalEntregas: 0,
    totalIngresos: 0,
    apuntes: '',
  }
  const batch = writeBatch(db)
  batch.set(refDia(uid, fecha), dia)
  if (!config.ultimoDia || fecha > config.ultimoDia) {
    batch.update(refConfig(uid), { ultimoDia: fecha })
  }
  enviar(batch)
}

/** Campos que se guardan de cada registro (sin el id, que es el del documento). */
function aDocumento(r: Registro, previo?: Registro): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, creadoEn, ...resto } = r
  return { ...resto, creadoEn: previo?.creadoEn ?? creadoEn ?? serverTimestamp() }
}

function mismoContenido(a: Registro, b: Registro): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sinFecha = ({ creadoEn, ...resto }: Registro) => resto
  const ordenar = (o: object) => JSON.stringify(Object.entries(o).sort(([x], [y]) => x.localeCompare(y)))
  return ordenar(sinFecha(a)) === ordenar(sinFecha(b))
}

export type CambiosDia = {
  uid: string
  dia: Dia
  /** Registros como estan guardados ahora. */
  antes: readonly Registro[]
  /** Registros como deben quedar (los que falten se borran). Ganancia, neto y banca se recalculan. */
  despues: readonly Registro[]
  /** Nueva banca inicial del dia, si se cambia. */
  bancaInicial?: number
  /** true si es el ultimo dia: su banca final pasa a ser la banca actual. */
  esUltimo: boolean
  /** Para sumar un uso al juego de una jugada nueva. */
  juegoUsado?: string
}

/**
 * Guarda un dia completo: recalcula todas sus lineas en orden, escribe solo
 * las que cambiaron, borra las que ya no estan, actualiza los totales del dia
 * y la banca actual / ganancia acumulada. Todo en un solo batch.
 *
 * Devuelve el dia recalculado.
 */
export function guardarCambiosDia(c: CambiosDia) {
  const ordenados = [...c.despues].sort((a, b) => a.orden - b.orden)
  const calculo = calcularDia(c.bancaInicial ?? c.dia.bancaInicial, ordenados)
  const registros = calculo.registros as Registro[]

  const batch = writeBatch(db)
  const previos = new Map(c.antes.map((r) => [r.id, r]))

  for (const r of registros) {
    const previo = previos.get(r.id)
    if (!previo || !mismoContenido(previo, r)) {
      batch.set(refRegistro(c.uid, c.dia.fecha, r.id), aDocumento(r, previo))
    }
    previos.delete(r.id)
  }
  for (const id of previos.keys()) {
    batch.delete(refRegistro(c.uid, c.dia.fecha, id))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { registros: _r, ...totales } = calculo
  batch.update(refDia(c.uid, c.dia.fecha), totales)

  const cambiosConfig: { gananciaAcumulada?: FieldValue; bancaActual?: number } = {}
  const deltaGanancia = totales.totalGanancia - c.dia.totalGanancia
  if (deltaGanancia !== 0) cambiosConfig.gananciaAcumulada = increment(deltaGanancia)
  if (c.esUltimo) cambiosConfig.bancaActual = totales.bancaFinal
  if (Object.keys(cambiosConfig).length) batch.update(refConfig(c.uid), cambiosConfig)

  if (c.juegoUsado) batch.update(refJuego(c.uid, c.juegoUsado), { usos: increment(1) })

  enviar(batch)
  return { ...totales, registros }
}
