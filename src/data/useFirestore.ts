import { useEffect, useState } from 'react'
import {
  onSnapshot,
  type DocumentReference,
  type Query,
} from 'firebase/firestore'

/**
 * Estado de una lectura en vivo:
 * - datos: undefined mientras carga, null si el documento no existe.
 * - desdeServidor: false si lo que se ve viene solo de la cache del telefono.
 */
export type Lectura<T> = { datos: T | undefined; desdeServidor: boolean }

export function useDocumento<T>(ref: DocumentReference | null): Lectura<T | null> {
  const ruta = ref?.path ?? null
  const [estado, setEstado] = useState<Lectura<T | null> & { ruta: string | null }>({
    datos: undefined,
    desdeServidor: false,
    ruta,
  })

  useEffect(() => {
    if (!ref) return
    return onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) =>
        setEstado({
          datos: snap.exists() ? (snap.data() as T) : null,
          desdeServidor: !snap.metadata.fromCache,
          ruta: ref.path,
        }),
      (err) => console.error(err),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta])

  // Si cambio la ruta y aun no llega el primer dato, se muestra "cargando".
  if (estado.ruta !== ruta) return { datos: undefined, desdeServidor: false }
  return estado
}

export function useColeccion<T extends { id: string }>(
  consulta: Query | null,
  clave: string | null,
): Lectura<T[]> {
  const [estado, setEstado] = useState<Lectura<T[]> & { clave: string | null }>({
    datos: undefined,
    desdeServidor: false,
    clave,
  })

  useEffect(() => {
    if (!consulta) return
    return onSnapshot(
      consulta,
      { includeMetadataChanges: true },
      (snap) =>
        setEstado({
          datos: snap.docs.map((d) => ({ ...(d.data() as Omit<T, 'id'>), id: d.id }) as T),
          desdeServidor: !snap.metadata.fromCache,
          clave,
        }),
      (err) => console.error(err),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  if (estado.clave !== clave) return { datos: undefined, desdeServidor: false }
  return estado
}
