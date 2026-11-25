import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { orderBy, query } from 'firebase/firestore'
import { useAuth } from '@/auth/AuthProvider'
import { colJuegos, refConfig } from './refs'
import { inicializarCuenta } from './operaciones'
import { useColeccion, useDocumento } from './useFirestore'
import type { Config, Juego } from './tipos'

type Datos = {
  uid: string
  /** undefined: cargando. null: cuenta nueva sin conexion para configurarla. */
  config: Config | null | undefined
  juegos: Juego[] | undefined
}

const DatosContext = createContext<Datos | null>(null)

export function DatosProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const uid = usuario!.uid

  const refCfg = useMemo(() => refConfig(uid), [uid])
  const consultaJuegos = useMemo(() => query(colJuegos(uid), orderBy('orden')), [uid])
  const config = useDocumento<Config>(refCfg)
  const juegos = useColeccion<Juego>(consultaJuegos, `juegos:${uid}`)

  // Primera vez: solo se crea la config cuando el servidor confirma que no existe,
  // para no pisar datos que el telefono todavia no ha descargado.
  const inicializado = useRef(false)
  useEffect(() => {
    if (config.datos === null && config.desdeServidor && !inicializado.current) {
      inicializado.current = true
      inicializarCuenta(uid)
    }
  }, [config.datos, config.desdeServidor, uid])

  const valor = useMemo<Datos>(
    () => ({
      uid,
      config:
        config.datos === null && config.desdeServidor
          ? undefined // se esta creando
          : config.datos,
      juegos: juegos.datos,
    }),
    [uid, config.datos, config.desdeServidor, juegos.datos],
  )

  return <DatosContext.Provider value={valor}>{children}</DatosContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDatos(): Datos {
  const ctx = useContext(DatosContext)
  if (!ctx) throw new Error('useDatos debe usarse dentro de DatosProvider')
  return ctx
}
