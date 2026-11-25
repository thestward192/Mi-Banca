import { useEffect } from 'react'

/**
 * Abre el menu al deslizar desde el borde izquierdo de la pantalla.
 * Solo se activa si el toque empieza a menos de 24 px del borde.
 */
export function useDeslizarDesdeBorde(onAbrir: () => void, activo: boolean) {
  useEffect(() => {
    if (!activo) return
    let inicioX = -1
    let inicioY = 0

    function start(e: TouchEvent) {
      const t = e.touches[0]
      inicioX = t.clientX <= 24 ? t.clientX : -1
      inicioY = t.clientY
    }
    function move(e: TouchEvent) {
      if (inicioX < 0) return
      const t = e.touches[0]
      const dx = t.clientX - inicioX
      const dy = Math.abs(t.clientY - inicioY)
      if (dx > 60 && dy < 40) {
        inicioX = -1
        onAbrir()
      }
    }
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchmove', move, { passive: true })
    return () => {
      window.removeEventListener('touchstart', start)
      window.removeEventListener('touchmove', move)
    }
  }, [onAbrir, activo])
}
