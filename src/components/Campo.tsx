import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { formatearMientrasEscribe } from '@/lib/formato'

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
}

/** Campo de monto: teclado numerico y separador de miles mientras escribe. */
export const InputMonto = forwardRef<HTMLInputElement, InputMontoProps>(function InputMonto(
  { valor, onValor, invalido, className, id, ...props },
  ref,
) {
  return (
    <Input
      ref={ref}
      id={id}
      inputMode="numeric"
      autoComplete="off"
      enterKeyHint="next"
      value={valor}
      onChange={(e) => onValor(formatearMientrasEscribe(e.target.value))}
      aria-invalid={invalido || undefined}
      aria-describedby={invalido ? `${id}-error` : undefined}
      className={cn('tabular text-lg', className)}
      {...props}
    />
  )
})
