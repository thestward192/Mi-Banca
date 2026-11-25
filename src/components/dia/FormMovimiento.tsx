import { useEffect, useState, type FormEvent } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Campo, InputMonto } from '@/components/Campo'
import { Hoja } from '@/components/Hoja'
import { cn } from '@/lib/utils'
import { efectoEnBanca } from '@/lib/calculos'
import { formatearMonto, formatearNumero, parsearMonto } from '@/lib/formato'
import type { DatosMovimiento, Movimiento } from '@/data/tipos'

type Props = {
  abierta: boolean
  onCambiar: (abierta: boolean) => void
  /** Movimiento a editar; sin el es uno nuevo. */
  movimiento: Movimiento | null
  /** Banca antes de este movimiento (para la vista previa). */
  bancaAntes: number
  confirmarBorrar: boolean
  onGuardar: (datos: DatosMovimiento) => void
  onEliminar: (movimiento: Movimiento) => void
}

/** Entrega a duenos (resta de la banca) o ingreso (suma). */
export function FormMovimiento({
  abierta,
  onCambiar,
  movimiento,
  bancaAntes,
  confirmarBorrar,
  onGuardar,
  onEliminar,
}: Props) {
  const [subtipo, setSubtipo] = useState<Movimiento['subtipo']>('entrega')
  const [monto, setMonto] = useState('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    if (!abierta) return
    setError('')
    setConfirmando(false)
    setSubtipo(movimiento?.subtipo ?? 'entrega')
    setMonto(movimiento ? formatearNumero(movimiento.monto) : '')
    setNota(movimiento?.nota ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, movimiento?.id])

  const montoN = parsearMonto(monto)
  const bancaQueda = bancaAntes + efectoEnBanca({ tipo: 'movimiento', subtipo, monto: montoN })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (montoN <= 0) {
      setError('Escribe el monto')
      return
    }
    onGuardar({ subtipo, monto: montoN, nota: nota.trim() })
  }

  function eliminar() {
    if (!movimiento) return
    if (confirmarBorrar && !confirmando) {
      setConfirmando(true)
      return
    }
    onEliminar(movimiento)
  }

  const tipoBoton = (valor: Movimiento['subtipo'], etiqueta: string, Icono: typeof Minus) => (
    <button
      type="button"
      onClick={() => setSubtipo(valor)}
      aria-pressed={subtipo === valor}
      className={cn(
        'flex min-h-14 flex-1 items-center justify-center gap-2 rounded-lg border-2 px-2 text-base font-medium transition-colors',
        subtipo === valor
          ? 'border-movimiento bg-movimiento/10 text-foreground'
          : 'border-border text-muted-foreground hover:bg-accent',
      )}
    >
      <Icono className={cn('size-5', subtipo === valor && 'text-movimiento')} />
      {etiqueta}
    </button>
  )

  return (
    <Hoja
      abierta={abierta}
      onCambiar={onCambiar}
      titulo={movimiento ? 'Editar movimiento' : 'Movimiento de banca'}
      pie={
        <div className="flex flex-col gap-3">
          <p className="tabular text-base">
            Banca quedará: <span className="font-bold">{formatearMonto(bancaQueda)}</span>
          </p>
          <Button type="submit" form="form-movimiento" size="lg" className="w-full">
            Guardar
          </Button>
        </div>
      }
    >
      <form id="form-movimiento" onSubmit={onSubmit} className="flex flex-col gap-4 pt-1" noValidate>
        <div className="flex gap-2" role="group" aria-label="Tipo de movimiento">
          {tipoBoton('entrega', 'Entrega a dueños', Minus)}
          {tipoBoton('ingreso', 'Ingreso', Plus)}
        </div>
        <p className="-mt-2 text-sm text-muted-foreground">
          {subtipo === 'entrega'
            ? 'Resta de la banca: plata que se pasa a los dueños.'
            : 'Suma a la banca: plata para cubrir premios o para corregir.'}
        </p>

        <Campo id="monto" etiqueta="Monto" error={error}>
          <InputMonto id="monto" valor={monto} onValor={setMonto} invalido={!!error} />
        </Campo>

        <Campo id="nota-mov" etiqueta="Nota (opcional)">
          <Input
            id="nota-mov"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={subtipo === 'entrega' ? 'Ej.: Entregado a don X' : 'Ej.: Me dieron para premios'}
          />
        </Campo>

        {movimiento && (
          <button
            type="button"
            onClick={eliminar}
            className="flex min-h-11 items-center gap-2 self-start text-sm font-medium text-destructive"
          >
            <Trash2 className="size-4" />
            {confirmando ? 'Toca otra vez para eliminar' : 'Eliminar movimiento'}
          </button>
        )}
      </form>
    </Hoja>
  )
}
