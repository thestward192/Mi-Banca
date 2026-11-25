import { useMemo } from 'react'
import { limit, orderBy, query, where } from 'firebase/firestore'
import { colDias } from './refs'
import { useColeccion } from './useFirestore'
import { useDatos } from './DatosProvider'
import type { Dia } from './tipos'

export type DiaConId = Dia & { id: string }

/** Los ultimos dias anotados, del mas reciente al mas viejo. */
export function useUltimosDias(cantidad: number) {
  const { uid } = useDatos()
  const consulta = useMemo(
    () => query(colDias(uid), orderBy('fecha', 'desc'), limit(cantidad)),
    [uid, cantidad],
  )
  return useColeccion<DiaConId>(consulta, `ultimos:${uid}:${cantidad}`).datos
}

/** Los dias entre dos fechas (incluidas), en orden. */
export function useDiasEntre(desde: string, hasta: string) {
  const { uid } = useDatos()
  const consulta = useMemo(
    () =>
      query(colDias(uid), where('fecha', '>=', desde), where('fecha', '<=', hasta), orderBy('fecha')),
    [uid, desde, hasta],
  )
  return useColeccion<DiaConId>(consulta, `rango:${uid}:${desde}:${hasta}`).datos
}
