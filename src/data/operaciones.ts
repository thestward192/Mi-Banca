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
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type FieldValue,
  type WriteBatch,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { calcularDia } from '@/lib/calculos'
import { colDias, colJuegos, colRegistros, refConfig, refDia, refJuego, refRegistro } from './refs'
import type { Config, Dia, Juego, Registro } from './tipos'

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

/** Apuntes del dia: texto libre que no afecta ningun calculo. */
export function guardarApuntes(uid: string, fecha: string, apuntes: string): Promise<void> {
  const batch = writeBatch(db)
  batch.update(refDia(uid, fecha), { apuntes })
  const p = batch.commit()
  p.catch((err) => {
    console.error(err)
    toast.error('No se pudieron guardar los apuntes')
  })
  return p
}

// ---------------------------------------------------------------------------
// Juegos (catalogo)
// ---------------------------------------------------------------------------

/** Busca un juego con el mismo nombre (sin importar mayusculas ni espacios). */
export function buscarJuegoPorNombre(juegos: readonly Juego[], nombre: string, excepto?: string) {
  const clave = nombre.trim().replace(/\s+/g, ' ').toLowerCase()
  return juegos.find((j) => j.id !== excepto && j.nombre.trim().toLowerCase() === clave)
}

/** Crea un juego al final de la lista. Devuelve el juego (se ve al instante, aun sin conexion). */
export function crearJuego(
  uid: string,
  juegos: readonly Juego[],
  datos: { nombre: string; porcentaje: number },
): Juego {
  const ref = doc(colJuegos(uid))
  const juego: Juego = {
    id: ref.id,
    nombre: datos.nombre.trim().replace(/\s+/g, ' '),
    porcentaje: datos.porcentaje,
    activo: true,
    orden: Math.max(0, ...juegos.map((j) => j.orden)) + 1,
    usos: 0,
  }
  const batch = writeBatch(db)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...resto } = juego
  batch.set(ref, resto)
  enviar(batch)
  return juego
}

export function actualizarJuego(
  uid: string,
  id: string,
  cambios: Partial<Pick<Juego, 'nombre' | 'porcentaje' | 'activo'>>,
) {
  const batch = writeBatch(db)
  batch.update(refJuego(uid, id), {
    ...cambios,
    ...(cambios.nombre !== undefined && { nombre: cambios.nombre.trim().replace(/\s+/g, ' ') }),
  })
  enviar(batch)
}

/** Guarda el nuevo orden (1, 2, 3...) de los juegos, solo los que cambiaron. */
export function reordenarJuegos(uid: string, ordenados: readonly Juego[]) {
  const batch = writeBatch(db)
  let cambios = 0
  ordenados.forEach((j, i) => {
    if (j.orden !== i + 1) {
      batch.update(refJuego(uid, j.id), { orden: i + 1 })
      cambios++
    }
  })
  if (cambios) enviar(batch)
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
 * Recalcula un dia con la banca inicial dada y agrega al batch solo lo que
 * cambio: lineas nuevas o distintas, lineas borradas y los totales del dia.
 * Devuelve el dia recalculado.
 */
function escribirDia(
  batch: WriteBatch,
  uid: string,
  dia: Dia,
  antes: readonly Registro[],
  despues: readonly Registro[],
  bancaInicial: number,
) {
  const ordenados = [...despues].sort((a, b) => a.orden - b.orden)
  const calculo = calcularDia(bancaInicial, ordenados)
  const registros = calculo.registros as Registro[]
  const previos = new Map(antes.map((r) => [r.id, r]))

  for (const r of registros) {
    const previo = previos.get(r.id)
    if (!previo || !mismoContenido(previo, r)) {
      batch.set(refRegistro(uid, dia.fecha, r.id), aDocumento(r, previo))
    }
    previos.delete(r.id)
  }
  for (const id of previos.keys()) {
    batch.delete(refRegistro(uid, dia.fecha, id))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { registros: _r, ...totales } = calculo
  const cambioTotales = (Object.keys(totales) as (keyof typeof totales)[]).some(
    (k) => totales[k] !== dia[k],
  )
  if (cambioTotales) batch.update(refDia(uid, dia.fecha), totales)
  return { ...totales, registros }
}

/** Dias posteriores a una fecha, con sus registros (de la cache si no hay senal). */
async function leerDiasPosteriores(uid: string, fecha: string) {
  const dias = await getDocs(query(colDias(uid), where('fecha', '>', fecha), orderBy('fecha')))
  return Promise.all(
    dias.docs.map(async (d) => {
      const regs = await getDocs(query(colRegistros(uid, d.id), orderBy('orden')))
      return {
        dia: d.data() as Dia,
        registros: regs.docs.map((r) => ({ ...(r.data() as Omit<Registro, 'id'>), id: r.id }) as Registro),
      }
    }),
  )
}

/**
 * Guarda un dia completo: recalcula todas sus lineas en orden, escribe solo
 * las que cambiaron, borra las que ya no estan y actualiza los totales.
 *
 * Si no es el ultimo dia, pasa la nueva banca final como banca inicial del
 * dia siguiente y asi en cadena hasta hoy (sistema-loteria.md, 5.2). Todo
 * (el dia editado, los siguientes y la config) va en un solo batch.
 *
 * Devuelve cuantos dias siguientes cambiaron de banca.
 */
export async function guardarCambiosDia(c: CambiosDia): Promise<{ diasSiguientes: number }> {
  const batch = writeBatch(db)
  const calculo = escribirDia(
    batch,
    c.uid,
    c.dia,
    c.antes,
    c.despues,
    c.bancaInicial ?? c.dia.bancaInicial,
  )

  const cambiosConfig: { gananciaAcumulada?: FieldValue; bancaActual?: number } = {}
  const deltaGanancia = calculo.totalGanancia - c.dia.totalGanancia
  if (deltaGanancia !== 0) cambiosConfig.gananciaAcumulada = increment(deltaGanancia)
  if (c.juegoUsado) batch.update(refJuego(c.uid, c.juegoUsado), { usos: increment(1) })

  let diasSiguientes = 0
  if (c.esUltimo) {
    cambiosConfig.bancaActual = calculo.bancaFinal
  } else if (calculo.bancaFinal !== c.dia.bancaFinal) {
    // La banca final cambio: recalcular en cadena los dias siguientes.
    const posteriores = await leerDiasPosteriores(c.uid, c.dia.fecha)
    let banca = calculo.bancaFinal
    for (const { dia, registros } of posteriores) {
      if (dia.bancaInicial !== banca) diasSiguientes++
      banca = escribirDia(batch, c.uid, dia, registros, registros, banca).bancaFinal
    }
    // Si no se pudieron leer (sin senal y sin cache), no se toca la banca actual.
    if (posteriores.length) cambiosConfig.bancaActual = banca
  }

  if (Object.keys(cambiosConfig).length) batch.update(refConfig(c.uid), cambiosConfig)
  enviar(batch)
  return { diasSiguientes }
}
