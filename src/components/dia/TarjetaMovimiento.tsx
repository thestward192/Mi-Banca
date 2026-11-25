import { ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatearNumero } from '@/lib/formato'
import type { Movimiento } from '@/data/tipos'

const HORA = new Intl.DateTimeFormat('es-CR', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Costa_Rica',
})

type Props = {
  movimiento: Movimiento
  resaltada?: boolean
  onTocar: () => void
}

/**
 * | <-> Entrega a duenos     -40.000
 * |     "Entregado a don X"  100.523
 */
export function TarjetaMovimiento({ movimiento: m, resaltada, onTocar }: Props) {
  const entrega = m.subtipo === 'entrega'
  const hora = m.creadoEn ? HORA.format(m.creadoEn.toDate()) : null

  return (
    <button
      type="button"
      onClick={onTocar}
      className={cn(
        'w-full overflow-hidden rounded-xl border border-l-4 border-l-movimiento bg-card p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,.06)] transition-colors duration-700 hover:bg-accent/50',
        resaltada && 'bg-movimiento/10',
      )}
      aria-label={`Editar movimiento: ${entrega ? 'entrega a dueños' : 'ingreso'} de ${formatearNumero(m.monto)}`}
    >
      <div className="flex items-baseline gap-2">
        <ArrowLeftRight className="size-4 shrink-0 self-center text-movimiento" />
        <span className="min-w-0 flex-1 truncate font-medium">
          {entrega ? 'Entrega a dueños' : 'Ingreso'}
        </span>
        <span className="tabular shrink-0 font-semibold text-movimiento">
          {entrega ? '−' : '+'}
          {formatearNumero(m.monto)}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2 pl-6 text-sm">
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          {m.nota ? `"${m.nota}"` : hora ? `A las ${hora}` : ''}
        </span>
        <span className="tabular shrink-0 text-base font-bold">{formatearNumero(m.bancaResultante)}</span>
      </div>
    </button>
  )
}
