import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { cambiarSigno, formatearMientrasEscribe } from '@/lib/formato'

type CampoProps = {
  id: string
  etiqueta: string
  error?: string
  children: ReactNode
  accion?: ReactNode
  className?: string
}

/** Etiqueta + campo + error en rojo debajo, en palabras simples. */
export function Campo({ id, etiqueta, error, children, accion, className }: CampoProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex min-h-6 items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {etiqueta}
        </Label>
        {accion}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

type InputMontoProps = Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
  valor: string
  onValor: (texto: string) => void
  invalido?: boolean
  /** Muestra un boton "+/−" para poner el monto en negativo (banca, acumulado). */
  permitirNegativo?: boolean
}

/** Campo de monto: teclado numerico y separador de miles mientras escribe. */
export const InputMonto = forwardRef<HTMLInputElement, InputMontoProps>(function InputMonto(
  { valor, onValor, invalido, permitirNegativo, className, id, ...props },
  ref,
) {
  const negativo = valor.startsWith('−')
  const campo = (
    <Input
      ref={ref}
      id={id}
      inputMode="numeric"
      autoComplete="off"
      enterKeyHint="next"
      value={valor}
      onChange={(e) => onValor(formatearMientrasEscribe(e.target.value, permitirNegativo))}
      aria-invalid={invalido || undefined}
      aria-describedby={invalido ? `${id}-error` : undefined}
      className={cn('tabular text-lg', negativo && 'text-premio', className)}
      {...props}
    />
  )
  if (!permitirNegativo) return campo
  return (
    <div className="flex gap-2">
      {campo}
      <button
        type="button"
        onClick={() => onValor(cambiarSigno(valor))}
        aria-pressed={negativo}
        aria-label={negativo ? 'Quitar el negativo' : 'Poner en negativo'}
        className={cn(
          'tabular flex h-12 min-w-14 shrink-0 items-center justify-center rounded-lg border px-3 text-lg font-semibold transition-colors',
          negativo ? 'border-premio bg-premio/10 text-premio' : 'border-input text-muted-foreground hover:bg-accent',
        )}
      >
        +/−
      </button>
    </div>
  )
})
