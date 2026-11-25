import { useState, type FormEvent, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Campo } from '@/components/Campo'
import { parsearPorcentaje } from '@/lib/formato'
import { buscarJuegoPorNombre } from '@/data/operaciones'
import type { Juego } from '@/data/tipos'

export type DatosJuego = { nombre: string; porcentaje: number }

type Props = {
  id: string
  juegos: readonly Juego[]
  /** Juego que se edita (para no compararlo consigo mismo). */
  editandoId?: string
  inicial: { nombre: string; porcentaje: string }
  onGuardar: (datos: DatosJuego) => void
  /** Contenido extra al final del formulario (interruptor de activo, etc.). */
  children?: ReactNode
  autoFocus?: boolean
}

/**
 * Nombre y % de un juego. El boton de guardar va afuera, con form={id}.
 */
export function FormJuego({ id, juegos, editandoId, inicial, onGuardar, children, autoFocus }: Props) {
  const [nombre, setNombre] = useState(inicial.nombre)
  const [porcentaje, setPorcentaje] = useState(inicial.porcentaje)
  const [errores, setErrores] = useState<{ nombre?: string; porcentaje?: string }>({})

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    const nuevos: typeof errores = {}
    const pct = parsearPorcentaje(porcentaje)
    if (!nombre.trim()) {
      nuevos.nombre = 'Escribe el nombre del juego'
    } else {
      const repetido = buscarJuegoPorNombre(juegos, nombre, editandoId)
      if (repetido) {
        nuevos.nombre = repetido.activo
          ? 'Ya existe un juego con ese nombre'
          : 'Ya existe ese juego, pero está desactivado. Actívalo en Juegos'
      }
    }
    if (pct === null) nuevos.porcentaje = 'Escribe un porcentaje entre 0 y 100'
    setErrores(nuevos)
    if (Object.keys(nuevos).length || pct === null) return
    onGuardar({ nombre: nombre.trim(), porcentaje: pct })
  }

  return (
    <form id={id} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Campo id={`${id}-nombre`} etiqueta="Nombre" error={errores.nombre}>
        <Input
          id={`${id}-nombre`}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="next"
          maxLength={40}
          placeholder="Ej.: Tica 7pm"
          aria-invalid={!!errores.nombre || undefined}
        />
      </Campo>
      <Campo id={`${id}-pct`} etiqueta="% de ganancia" error={errores.porcentaje} className="max-w-40">
        <div className="relative">
          <Input
            id={`${id}-pct`}
            inputMode="decimal"
            value={porcentaje}
            onChange={(e) => setPorcentaje(e.target.value)}
            enterKeyHint="done"
            className="tabular pr-8"
            aria-invalid={!!errores.porcentaje || undefined}
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
            %
          </span>
        </div>
      </Campo>
      {children}
    </form>
  )
}
