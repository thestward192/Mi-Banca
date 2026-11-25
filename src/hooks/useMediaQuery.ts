import { useSyncExternalStore } from 'react'

export function useMediaQuery(consulta: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(consulta)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia(consulta).matches,
    () => false,
  )
}

/** Tableta o mas grande (>= 640 px): formularios como ventana centrada. */
export const useEsPantallaAncha = () => useMediaQuery('(min-width: 640px)')
