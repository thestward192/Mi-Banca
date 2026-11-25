import { StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatearConSigno, formatearNumero } from '@/lib/formato'
import type { Jugada } from '@/data/tipos'

type Props = {
  jugada: Jugada
  resaltada?: boolean
  onTocar: () => void
}

/**
 * #98  Primera          96.188
 * Vendio 9.750   Gan. +585
 * Neto 9.165     Premio -13.500
 */
export function TarjetaJugada({ jugada: j, resaltada, onTocar }: Props) {
  return (
    <button
      type="button"
      onClick={onTocar}
      className={cn(
        'w-full rounded-xl border bg-card p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,.06)] transition-colors duration-700 hover:bg-accent/50',
        resaltada && 'border-primary bg-primary/10',
      )}
      aria-label={`Editar jugada ${j.numero ? '#' + j.numero + ' ' : ''}${j.juegoNombre}`}
    >
      <div className="flex items-baseline gap-2">
        {j.numero && <span className="tabular font-semibold">#{j.numero}</span>}
        <span className="min-w-0 flex-1 truncate">{j.juegoNombre}</span>
        <span className="tabular text-base font-bold">{formatearNumero(j.bancaResultante)}</span>
      </div>

      <dl className="tabular mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Vendió</dt>
          <dd>{formatearNumero(j.vendido)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Gan.</dt>
          <dd className="text-ganancia">
            {formatearConSigno(j.ganancia)}
            {j.porcentaje !== 6 && (
              <span className="ml-1 text-xs text-muted-foreground">({j.porcentaje}%)</span>
            )}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Neto</dt>
          <dd>{formatearNumero(j.neto)}</dd>
        </div>
        <div className="flex gap-1.5">
          {j.premio > 0 ? (
            <>
              <dt className="text-muted-foreground">Premio</dt>
              <dd className="text-premio">{formatearConSigno(-j.premio)}</dd>
            </>
          ) : (
            <dt className="text-muted-foreground">Sin premio</dt>
          )}
        </div>
      </dl>

      {j.nota && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <StickyNote className="size-4 shrink-0" />
          <span className="truncate">{j.nota}</span>
        </p>
      )}
    </button>
  )
}
