import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUltimosDias, type DiaConId } from '@/data/useDias'
import { useHoy } from '@/hooks/useHoy'
import { fechaCorta } from '@/lib/fecha'
import { formatearConSigno, formatearMonto, formatearNumero } from '@/lib/formato'
import { nombreMes } from '@/lib/periodos'

const POR_PAGINA = 31

/** Lista de dias con su ganancia, premios y banca final. Al tocar uno se abre igual que Hoy. */
export default function Historial() {
  const hoy = useHoy()
  const [cantidad, setCantidad] = useState(POR_PAGINA)
  const dias = useUltimosDias(cantidad)

  if (!dias) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (dias.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3 py-16 text-center">
        <CalendarDays className="size-8 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Todavía no hay días anotados</h2>
      </section>
    )
  }

  // Agrupar por mes ("Noviembre 2026").
  const grupos: { mes: string; dias: DiaConId[] }[] = []
  for (const d of dias) {
    const mes = d.fecha.slice(0, 7)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.mes === mes) ultimo.dias.push(d)
    else grupos.push({ mes, dias: [d] })
  }

  return (
    <section className="flex flex-col gap-4 pb-8">
      {grupos.map((g) => (
        <div key={g.mes} className="flex flex-col gap-2">
          <h3 className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {nombreMes(g.mes)}
          </h3>
          <ul className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,.06)]">
            {g.dias.map((d) => (
              <li key={d.id} className="border-b last:border-0">
                <FilaDia dia={d} esHoy={d.fecha === hoy} />
              </li>
            ))}
          </ul>
        </div>
      ))}

      {dias.length === cantidad && (
        <Button variant="outline" onClick={() => setCantidad((c) => c + POR_PAGINA)}>
          Ver días más viejos
        </Button>
      )}
    </section>
  )
}

function FilaDia({ dia: d, esHoy }: { dia: DiaConId; esHoy: boolean }) {
  return (
    <Link
      to={esHoy ? '/' : `/dia/${d.fecha}`}
      className="flex min-h-16 items-center gap-3 px-3 py-2.5 hover:bg-accent/50"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {fechaCorta(d.fecha)}
          {esHoy && <span className="ml-2 text-xs font-normal text-muted-foreground">Hoy</span>}
        </p>
        <p className="tabular mt-0.5 flex flex-wrap gap-x-3 text-sm">
          <span className="text-ganancia">Gan. {formatearConSigno(d.totalGanancia)}</span>
          {d.totalPremios > 0 ? (
            <span className="text-premio">Premios {formatearConSigno(-d.totalPremios)}</span>
          ) : (
            <span className="text-muted-foreground">Sin premios</span>
          )}
          {(d.totalEntregas ?? 0) > 0 && (
            <span className="text-movimiento">Entregas −{formatearNumero(d.totalEntregas)}</span>
          )}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Banca</p>
        <p className={'tabular font-bold ' + (d.bancaFinal < 0 ? 'text-premio' : '')}>
          {formatearMonto(d.bancaFinal)}
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}
