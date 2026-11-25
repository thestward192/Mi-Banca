import { useEffect, useMemo, useRef } from 'react'
import { orderBy, query } from 'firebase/firestore'
import { colRegistros, refDia } from './refs'
import { crearDia } from './operaciones'
import { useColeccion, useDocumento } from './useFirestore'
import { useDatos } from './DatosProvider'
import type { Dia, Registro } from './tipos'

/**
 * Lee un dia y sus registros en vivo.
 * Con crearSiFalta, si el dia no existe se crea con la banca actual como inicial.
 */
export function useDia(fecha: string, { crearSiFalta = false } = {}) {
  const { uid, config } = useDatos()

  const ref = useMemo(() => refDia(uid, fecha), [uid, fecha])
  const consulta = useMemo(
    () => query(colRegistros(uid, fecha), orderBy('orden')),
    [uid, fecha],
  )
  const dia = useDocumento<Dia>(ref)
  const registros = useColeccion<Registro>(consulta, `${uid}/${fecha}`)

  const creado = useRef<string | null>(null)
  useEffect(() => {
    if (!crearSiFalta || !config || dia.datos !== null) return
    // Con conexion, se espera la respuesta del servidor; sin conexion se crea igual.
    if (!dia.desdeServidor && navigator.onLine) return
    if (creado.current === fecha) return
    creado.current = fecha
    crearDia(uid, fecha, config)
  }, [crearSiFalta, config, dia.datos, dia.desdeServidor, fecha, uid])

  return {
    dia: dia.datos ?? undefined,
    registros: registros.datos,
    cargando: dia.datos == null || registros.datos === undefined,
    /** El dia no existe (confirmado por el servidor, o sin conexion y sin copia guardada). */
    noExiste: dia.datos === null && (dia.desdeServidor || !navigator.onLine),
  }
}
