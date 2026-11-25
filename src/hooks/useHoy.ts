import { useEffect, useState } from 'react'
import { hoyISO } from '@/lib/fecha'

/** Fecha de hoy (Costa Rica). Cambia sola a medianoche o al volver a la app. */
export function useHoy(): string {
  const [hoy, setHoy] = useState(hoyISO)
  useEffect(() => {
    const revisar = () => setHoy(hoyISO())
    const intervalo = window.setInterval(revisar, 60_000)
    document.addEventListener('visibilitychange', revisar)
    return () => {
      window.clearInterval(intervalo)
      document.removeEventListener('visibilitychange', revisar)
    }
  }, [])
  return hoy
}
