import { useEffect, useRef, useState } from 'react'
import { Check, StickyNote } from 'lucide-react'
import { guardarApuntes } from '@/data/operaciones'
import { useEnLinea } from '@/hooks/useEnLinea'

type Props = { uid: string; fecha: string; apuntes: string }

type Estado = 'quieto' | 'escribiendo' | 'guardado'

/**
 * Apuntes del dia ("Chelo 23400", recordatorios...). Se escribe directo
 * y se guarda solo, un momento despues de dejar de escribir.
 */
export function Apuntes({ uid, fecha, apuntes }: Props) {
  const [texto, setTexto] = useState(apuntes)
  const [estado, setEstado] = useState<Estado>('quieto')
  const enfocado = useRef(false)
  const temporizador = useRef<number | undefined>(undefined)
  const enLinea = useEnLinea()

  // Si cambia desde otro lado (otro telefono) y no lo esta editando, se actualiza.
  useEffect(() => {
    if (!enfocado.current) setTexto(apuntes)
  }, [apuntes])

  // Guardar lo pendiente al salir de la pantalla.
  const pendiente = useRef<string | null>(null)
  useEffect(
    () => () => {
      window.clearTimeout(temporizador.current)
      if (pendiente.current !== null) guardarApuntes(uid, fecha, pendiente.current)
    },
    [uid, fecha],
  )

  function guardar(valor: string) {
    pendiente.current = null
    // Sin conexion la promesa espera a que vuelva el internet; el cambio ya quedo en el telefono.
    setEstado('guardado')
    guardarApuntes(uid, fecha, valor)
  }

  function onCambiar(valor: string) {
    setTexto(valor)
    setEstado('escribiendo')
    pendiente.current = valor
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => guardar(valor), 800)
  }

  return (
    <section className="rounded-xl border bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
      <div className="mb-2 flex items-center gap-2">
        <StickyNote className="size-5 text-muted-foreground" />
        <label htmlFor="apuntes" className="flex-1 font-medium">
          Apuntes del día
        </label>
        <span className="flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
          {estado === 'escribiendo' && 'Escribiendo…'}
          {estado === 'guardado' && (
            <>
              <Check className="size-3.5" /> {enLinea ? 'Guardado' : 'Guardado en el teléfono'}
            </>
          )}
        </span>
      </div>
      <textarea
        id="apuntes"
        value={texto}
        onChange={(e) => onCambiar(e.target.value)}
        onFocus={() => (enfocado.current = true)}
        onBlur={() => {
          enfocado.current = false
          if (pendiente.current !== null) {
            window.clearTimeout(temporizador.current)
            guardar(pendiente.current)
          }
        }}
        rows={3}
        placeholder="Ej.: Chelo 23400, recordatorios…"
        className="field-sizing-content min-h-20 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </section>
  )
}
