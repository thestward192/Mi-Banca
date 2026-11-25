import type { Timestamp } from 'firebase/firestore'

/** usuarios/{uid}/config/general */
export type Config = {
  porcentajeDefault: number
  bancaActual: number
  gananciaAcumulada: number
  /** Fecha (AAAA-MM-DD) del ultimo dia creado. */
  ultimoDia?: string
  confirmarBorrar?: boolean
  /** Simbolo que va antes de los montos (por defecto ₡). */
  simboloMoneda?: string
  /** Nombre que aparece arriba en el menu (por defecto, el usuario). */
  nombre?: string
  juegosIniciados?: boolean
}

/** usuarios/{uid}/juegos/{juegoId} */
export type Juego = {
  id: string
  nombre: string
  porcentaje: number
  activo: boolean
  orden: number
  usos?: number
}

/** usuarios/{uid}/dias/{AAAA-MM-DD} */
export type Dia = {
  fecha: string
  bancaInicial: number
  bancaFinal: number
  totalVendido: number
  totalGanancia: number
  totalPremios: number
  totalEntregas: number
  totalIngresos: number
  apuntes: string
}

type RegistroBase = {
  id: string
  orden: number
  creadoEn?: Timestamp | null
  nota: string
  bancaResultante: number
}

/** usuarios/{uid}/dias/{fecha}/registros/{id} con tipo "jugada" */
export type Jugada = RegistroBase & {
  tipo: 'jugada'
  numero: string
  juegoId: string
  juegoNombre: string
  vendido: number
  porcentaje: number
  ganancia: number
  neto: number
  premio: number
}

/** usuarios/{uid}/dias/{fecha}/registros/{id} con tipo "movimiento" */
export type Movimiento = RegistroBase & {
  tipo: 'movimiento'
  subtipo: 'entrega' | 'ingreso'
  monto: number
}

export type Registro = Jugada | Movimiento

/** usuarios/{uid}/cobrosGanancia/{id}: cuando cobra su comision. No toca la banca. */
export type Cobro = {
  id: string
  monto: number
  fecha: string // AAAA-MM-DD
  nota: string
  creadoEn?: Timestamp | null
}

/** Lo que se llena en el formulario de movimiento. */
export type DatosMovimiento = Pick<Movimiento, 'subtipo' | 'monto' | 'nota'>

/** Lo que se llena en el formulario de jugada. */
export type DatosJugada = Pick<
  Jugada,
  'numero' | 'juegoId' | 'juegoNombre' | 'vendido' | 'porcentaje' | 'premio' | 'nota'
>
