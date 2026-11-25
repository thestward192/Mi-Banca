import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Opcion<T extends string> = { valor: T; etiqueta: string; icono?: LucideIcon }

type Props<T extends string> = {
  etiqueta: string
  opciones: Opcion<T>[]
  valor: T
  onCambiar: (valor: T) => void
}

/** Botones grandes para elegir una opcion (Claro / Oscuro / Automatico, etc.). */
export function Opciones<T extends string>({ etiqueta, opciones, valor, onCambiar }: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className="grid gap-1 rounded-xl bg-muted p-1"
      style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}
    >
      {opciones.map(({ valor: v, etiqueta: e, icono: Icono }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={valor === v}
          onClick={() => onCambiar(v)}
          className={cn(
            'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-sm font-medium transition-colors',
            valor === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
          )}
        >
          {Icono && <Icono className="size-5" />}
          <span className="leading-tight">{e}</span>
        </button>
      ))}
    </div>
  )
}
