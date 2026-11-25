import { cn } from '@/lib/utils'
import { formatearNumero } from '@/lib/formato'
import type { Registro } from '@/data/tipos'

type Props = {
  registros: Registro[]
  resaltadoId: string | null
  onTocar: (r: Registro) => void
}

/** Computadora: las lineas en tabla, como el cuaderno. */
export function TablaRegistros({ registros, resaltadoId, onTocar }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,.06)]">
      <table className="tabular w-full text-sm">
        <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
          <tr>
            <th className="px-3 py-2 text-left font-medium">#</th>
            <th className="px-3 py-2 text-left font-medium">Juego</th>
            <th className="px-3 py-2 text-right font-medium">Vendido</th>
            <th className="px-3 py-2 text-right font-medium">%</th>
            <th className="px-3 py-2 text-right font-medium">Ganancia</th>
            <th className="px-3 py-2 text-right font-medium">Neto</th>
            <th className="px-3 py-2 text-right font-medium">Premio</th>
            <th className="px-3 py-2 text-right font-medium">Banca</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => (
            <tr
              key={r.id}
              onClick={() => onTocar(r)}
              className={cn(
                'cursor-pointer border-b transition-colors duration-700 last:border-0 hover:bg-accent/50',
                resaltadoId === r.id && 'bg-primary/10',
              )}
            >
              {r.tipo === 'jugada' ? (
                <>
                  <td className="px-3 py-2.5 font-semibold">{r.numero}</td>
                  <td className="px-3 py-2.5">
                    {r.juegoNombre}
                    {r.nota && <span className="ml-2 text-muted-foreground">· {r.nota}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right">{formatearNumero(r.vendido)}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{r.porcentaje}</td>
                  <td className="px-3 py-2.5 text-right text-ganancia">{formatearNumero(r.ganancia)}</td>
                  <td className="px-3 py-2.5 text-right">{formatearNumero(r.neto)}</td>
                  <td className="px-3 py-2.5 text-right text-premio">
                    {r.premio > 0 ? formatearNumero(r.premio) : <span className="text-muted-foreground">x</span>}
                  </td>
                </>
              ) : (
                <>
                  <td className="border-l-4 border-l-movimiento px-3 py-2.5" />
                  <td className="px-3 py-2.5" colSpan={5}>
                    {r.subtipo === 'entrega' ? 'Entrega a dueños' : 'Ingreso'}
                    {r.nota && <span className="ml-2 text-muted-foreground">· {r.nota}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-movimiento">
                    {r.subtipo === 'entrega' ? '−' : '+'}
                    {formatearNumero(r.monto)}
                  </td>
                </>
              )}
              <td className="px-3 py-2.5 text-right font-bold">{formatearNumero(r.bancaResultante)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
