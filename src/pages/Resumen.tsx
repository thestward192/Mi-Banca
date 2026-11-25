import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDiasEntre } from '@/data/useDias'
import { useHoy } from '@/hooks/useHoy'
import { cn } from '@/lib/utils'
import { fechaCorta } from '@/lib/fecha'
import { formatearConSigno, formatearMonto, formatearNumero } from '@/lib/formato'
import {
  etiquetaPeriodo,
  moverPeriodo,
  nombreMes,
  rangoPeriodo,
  totalesPeriodo,
  totalesPorMes,
  type TipoPeriodo,
} from '@/lib/periodos'

const TIPOS: { valor: TipoPeriodo; etiqueta: string }[] = [
  { valor: 'semana', etiqueta: 'Semana' },
  { valor: 'mes', etiqueta: 'Mes' },
  { valor: 'anio', etiqueta: 'Año' },
]

/** Totales por semana, mes o ano: vendido, ganancia, premios y movimientos. */
export default function Resumen() {
  const hoy = useHoy()
  const [tipo, setTipo] = useState<TipoPeriodo>('semana')
  const [ancla, setAncla] = useState(hoy)

  const rango = rangoPeriodo(tipo, ancla)
  const dias = useDiasEntre(rango.desde, rango.hasta)
  const hayPosterior = moverPeriodo(tipo, ancla, 1) <= hoy
  const esActual = rango.desde <= hoy && hoy <= rango.hasta

  const t = dias ? totalesPeriodo(dias) : null

  return (
    <section className="flex flex-col gap-4 pb-8">
      {/* Semana / Mes / Ano */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="tablist">
        {TIPOS.map(({ valor, etiqueta }) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={tipo === valor}
            onClick={() => setTipo(valor)}
            className={cn(
              'min-h-11 rounded-lg text-base font-medium transition-colors',
              tipo === valor ? 'bg-card shadow-sm' : 'text-muted-foreground',
            )}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {/* Periodo anterior / siguiente */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Periodo anterior"
          onClick={() => setAncla(moverPeriodo(tipo, ancla, -1))}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div className="flex-1 text-center">
          <p className="font-semibold">{etiquetaPeriodo(tipo, rango)}</p>
          {!esActual && (
            <button
              type="button"
              className="text-sm text-muted-foreground underline underline-offset-4"
              onClick={() => setAncla(hoy)}
            >
              Volver a {tipo === 'semana' ? 'esta semana' : tipo === 'mes' ? 'este mes' : 'este año'}
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Periodo siguiente"
          disabled={!hayPosterior}
          onClick={() => setAncla(moverPeriodo(tipo, ancla, 1))}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {!t ? (
        <div className="h-48 animate-pulse rounded-xl bg-muted" aria-busy="true" />
      ) : t.dias === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          No hay días anotados en este periodo
        </p>
      ) : (
        <>
          <div className="rounded-xl border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
            <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Ganancia
            </p>
            <p className="tabular mt-1 text-center text-[2rem] leading-tight font-bold text-ganancia">
              +{formatearMonto(t.ganancia)}
            </p>
            <dl className="tabular mt-4 divide-y text-base">
              <Fila etiqueta="Vendido" valor={formatearMonto(t.vendido)} />
              <Fila
                etiqueta="Premios pagados"
                valor={t.premios ? `−${formatearMonto(t.premios)}` : formatearMonto(0)}
                color="text-premio"
              />
              {t.entregas > 0 && (
                <Fila
                  etiqueta="Entregas a dueños"
                  valor={`−${formatearMonto(t.entregas)}`}
                  color="text-movimiento"
                />
              )}
              {t.ingresos > 0 && (
                <Fila etiqueta="Ingresos" valor={`+${formatearMonto(t.ingresos)}`} color="text-movimiento" />
              )}
              <Fila etiqueta="Días anotados" valor={String(t.dias)} />
              {t.bancaFinal !== null && (
                <Fila etiqueta="Banca al cierre" valor={formatearMonto(t.bancaFinal)} fuerte />
              )}
            </dl>
          </div>

          {tipo === 'anio' ? (
            <Desglose titulo="Por mes">
              {totalesPorMes(dias!).map((m) => (
                <li key={m.mes} className="border-b last:border-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTipo('mes')
                      setAncla(`${m.mes}-01`)
                    }}
                    className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent/50"
                  >
                    <FilaDesglose
                      titulo={nombreMes(m.mes)}
                      subtitulo={`${m.dias} ${m.dias === 1 ? 'día' : 'días'} · Vendido ${formatearNumero(m.vendido)}`}
                      ganancia={m.ganancia}
                    />
                  </button>
                </li>
              ))}
            </Desglose>
          ) : (
            <Desglose titulo="Por día">
              {[...dias!].reverse().map((d) => (
                <li key={d.id} className="border-b last:border-0">
                  <Link
                    to={d.fecha === hoy ? '/' : `/dia/${d.fecha}`}
                    className="flex min-h-14 items-center gap-3 px-3 py-2 hover:bg-accent/50"
                  >
                    <FilaDesglose
                      titulo={fechaCorta(d.fecha)}
                      subtitulo={`Vendido ${formatearNumero(d.totalVendido)} · Premios ${formatearNumero(d.totalPremios)}`}
                      ganancia={d.totalGanancia}
                    />
                  </Link>
                </li>
              ))}
            </Desglose>
          )}
        </>
      )}
    </section>
  )
}

function Fila({
  etiqueta,
  valor,
  color,
  fuerte,
}: {
  etiqueta: string
  valor: string
  color?: string
  fuerte?: boolean
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 py-1.5">
      <dt className={fuerte ? 'font-semibold' : 'text-muted-foreground'}>{etiqueta}</dt>
      <dd className={cn(color, fuerte && 'font-bold')}>{valor}</dd>
    </div>
  )
}

function Desglose({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{titulo}</h3>
      <ul className="overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,.06)]">
        {children}
      </ul>
    </div>
  )
}

function FilaDesglose({
  titulo,
  subtitulo,
  ganancia,
}: {
  titulo: string
  subtitulo: string
  ganancia: number
}) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{titulo}</p>
        <p className="tabular truncate text-sm text-muted-foreground">{subtitulo}</p>
      </div>
      <span className="tabular font-semibold text-ganancia">{formatearConSigno(ganancia)}</span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </>
  )
}
