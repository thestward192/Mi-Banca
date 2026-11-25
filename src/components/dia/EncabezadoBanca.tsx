import { ChevronRight } from 'lucide-react'
import { formatearMonto } from '@/lib/formato'

type Props = {
  etiquetaBanca?: string
  banca: number
  gananciaHoy: number
  gananciaAcumulada: number | undefined
  etiquetaGanancia?: string
  onAbrirResumen: () => void
}

/** La banca es el numero mas grande de la app. Al tocarlo se abre el resumen del dia. */
export function EncabezadoBanca({
  etiquetaBanca = 'Banca',
  banca,
  gananciaHoy,
  gananciaAcumulada,
  etiquetaGanancia = 'Ganancia hoy',
  onAbrirResumen,
}: Props) {
  return (
    <button
      type="button"
      onClick={onAbrirResumen}
      className="group w-full rounded-xl border bg-card px-4 py-4 text-center shadow-[0_1px_2px_rgba(0,0,0,.06)] transition-colors hover:bg-accent/50"
      aria-label="Ver resumen del día"
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{etiquetaBanca}</p>
      <p
        className={
          'tabular mt-1 text-[2.25rem] leading-tight font-bold ' + (banca < 0 ? 'text-premio' : '')
        }
      >
        {formatearMonto(banca)}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          {etiquetaGanancia}{' '}
          <span className="tabular font-medium text-ganancia">+{formatearMonto(gananciaHoy)}</span>
        </span>
        {gananciaAcumulada !== undefined && (
          <span>
            Acumulada{' '}
            <span className="tabular font-medium text-foreground">
              {formatearMonto(gananciaAcumulada)}
            </span>
          </span>
        )}
        <ChevronRight className="size-4 opacity-60" aria-hidden />
      </div>
    </button>
  )
}
