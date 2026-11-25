import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Campo, InputMonto } from '@/components/Campo'
import { Hoja } from '@/components/Hoja'
import { fechaCorta } from '@/lib/fecha'
import { formatearMonto, formatearNumero, parsearMonto } from '@/lib/formato'
import type { Dia } from '@/data/tipos'

type Props = {
  abierto: boolean
  onCambiar: (abierto: boolean) => void
  dia: Dia
  onCambiarBancaInicial: (monto: number) => void
}

export function ResumenDia({ abierto, onCambiar, dia, onCambiarBancaInicial }: Props) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState('')

  function cerrar(v: boolean) {
    if (!v) setEditando(false)
    onCambiar(v)
  }

  function guardar() {
    onCambiarBancaInicial(parsearMonto(valor))
    setEditando(false)
  }

  const filas: [string, number, string?][] = [
    ['Total vendido', dia.totalVendido],
    ['Ganancia', dia.totalGanancia, 'text-ganancia'],
    ['Premios', -dia.totalPremios, 'text-premio'],
    ['Entregas a dueños', -dia.totalEntregas, 'text-movimiento'],
    ['Ingresos', dia.totalIngresos, 'text-movimiento'],
  ]

  return (
    <Hoja abierta={abierto} onCambiar={cerrar} titulo={`Resumen · ${fechaCorta(dia.fecha)}`}>
      <dl className="tabular divide-y">
        {editando ? (
          <form
            className="flex flex-col gap-3 py-3"
            onSubmit={(e) => {
              e.preventDefault()
              guardar()
            }}
          >
            <Campo id="banca-inicial" etiqueta="Banca inicial">
              <InputMonto id="banca-inicial" valor={valor} onValor={setValor} autoFocus />
            </Campo>
            <p className="text-sm text-muted-foreground">
              Las bancas de las líneas de este día se vuelven a calcular.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left"
            onClick={() => {
              setValor(formatearNumero(dia.bancaInicial))
              setEditando(true)
            }}
          >
            <dt className="flex items-center gap-2">
              Banca inicial <Pencil className="size-4 text-muted-foreground" />
            </dt>
            <dd className="font-medium">{formatearMonto(dia.bancaInicial)}</dd>
          </button>
        )}

        {filas.map(([etiqueta, monto, color]) => (
          <div key={etiqueta} className="flex min-h-12 items-center justify-between gap-3 py-2">
            <dt className="text-muted-foreground">{etiqueta}</dt>
            <dd className={color}>
              {monto < 0 ? '−' : ''}
              {formatearMonto(Math.abs(monto))}
            </dd>
          </div>
        ))}

        <div className="flex min-h-12 items-center justify-between gap-3 py-2">
          <dt className="font-semibold">Banca final</dt>
          <dd className="text-lg font-bold">{formatearMonto(dia.bancaFinal)}</dd>
        </div>
      </dl>
    </Hoja>
  )
}
