import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftRight, ChevronRight, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Campo, InputMonto } from '@/components/Campo'
import { Hoja } from '@/components/Hoja'
import { useDatos } from '@/data/DatosProvider'
import { guardarCambiosDia } from '@/data/operaciones'
import { nuevoIdRegistro } from '@/data/refs'
import type { Movimiento } from '@/data/tipos'
import { useDia } from '@/data/useDia'
import { useUltimosDias } from '@/data/useDias'
import { useHoy } from '@/hooks/useHoy'
import { fechaConAnio } from '@/lib/fecha'
import { formatearMonto, formatearNumero, parsearMonto } from '@/lib/formato'

/** Banca actual, ajuste manual con motivo y lista de dias con entregas o ingresos. */
export default function Banca() {
  const { uid, config } = useDatos()
  const hoy = useHoy()
  const navigate = useNavigate()
  const { dia, registros } = useDia(hoy, { crearSiFalta: true })
  const ultimos = useUltimosDias(62)
  const [ajustando, setAjustando] = useState(false)

  if (!config) return <div className="h-48 animate-pulse rounded-xl bg-muted" aria-busy="true" />

  const banca = dia?.bancaFinal ?? config.bancaActual
  const conMovimientos = (ultimos ?? []).filter(
    (d) => (d.totalEntregas ?? 0) > 0 || (d.totalIngresos ?? 0) > 0,
  )

  function ajustar(real: number, motivo: string) {
    if (!dia || !registros || !config) return
    const diferencia = real - dia.bancaFinal
    if (diferencia === 0) {
      toast('La banca ya está en ese monto')
      setAjustando(false)
      return
    }
    const mov: Movimiento = {
      id: nuevoIdRegistro(uid, hoy),
      orden: Math.max(0, ...registros.map((r) => r.orden)) + 1,
      tipo: 'movimiento',
      subtipo: diferencia > 0 ? 'ingreso' : 'entrega',
      monto: Math.abs(diferencia),
      nota: `Ajuste: ${motivo}`,
      creadoEn: null,
      bancaResultante: 0,
    }
    guardarCambiosDia({
      uid,
      dia,
      antes: registros,
      despues: [...registros, mov],
      esUltimo: !config.ultimoDia || hoy >= config.ultimoDia,
    })
    toast.success(`Banca ajustada a ${formatearMonto(real)}`)
    setAjustando(false)
  }

  return (
    <section className="flex flex-col gap-4 pb-8">
      <div className="rounded-xl border bg-card p-4 text-center shadow-[0_1px_2px_rgba(0,0,0,.06)]">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Banca actual</p>
        <p
          className={
            'tabular mt-1 text-[2.25rem] leading-tight font-bold ' + (banca < 0 ? 'text-premio' : '')
          }
        >
          {formatearMonto(banca)}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" onClick={() => navigate('/', { state: { abrir: 'movimiento' } })}>
          <ArrowLeftRight /> Entrega o ingreso
        </Button>
        <Button size="lg" variant="outline" onClick={() => setAjustando(true)} disabled={!dia}>
          <Scale /> Ajustar la banca
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Días con movimientos
        </h2>
        {!ultimos ? (
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
        ) : conMovimientos.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No hay entregas ni ingresos en los últimos días
          </p>
        ) : (
          <ul className="overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,.06)]">
            {conMovimientos.map((d) => (
              <li key={d.id} className="border-b last:border-0">
                <Link
                  to={d.fecha === hoy ? '/' : `/dia/${d.fecha}`}
                  className="flex min-h-14 items-center gap-3 border-l-4 border-l-movimiento px-3 py-2 hover:bg-accent/50"
                >
                  <span className="flex-1 font-medium">{fechaConAnio(d.fecha, hoy.slice(0, 4))}</span>
                  <span className="tabular flex flex-col items-end text-sm text-movimiento">
                    {(d.totalEntregas ?? 0) > 0 && <span>Entregas −{formatearNumero(d.totalEntregas)}</span>}
                    {(d.totalIngresos ?? 0) > 0 && <span>Ingresos +{formatearNumero(d.totalIngresos)}</span>}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <HojaAjuste abierta={ajustando} onCambiar={setAjustando} banca={banca} onAjustar={ajustar} />
    </section>
  )
}

function HojaAjuste({
  abierta,
  onCambiar,
  banca,
  onAjustar,
}: {
  abierta: boolean
  onCambiar: (v: boolean) => void
  banca: number
  onAjustar: (real: number, motivo: string) => void
}) {
  const [real, setReal] = useState('')
  const [motivo, setMotivo] = useState('')
  const [errores, setErrores] = useState<{ real?: string; motivo?: string }>({})

  useEffect(() => {
    if (!abierta) return
    setReal('')
    setMotivo('')
    setErrores({})
  }, [abierta])

  const diferencia = real ? parsearMonto(real) - banca : 0

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const nuevos: typeof errores = {}
    if (!real) nuevos.real = 'Escribe cuánto hay en la banca'
    if (!motivo.trim()) nuevos.motivo = 'Escribe el motivo del ajuste'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return
    onAjustar(parsearMonto(real), motivo.trim())
  }

  return (
    <Hoja
      abierta={abierta}
      onCambiar={onCambiar}
      titulo="Ajustar la banca"
      pie={
        <div className="flex flex-col gap-3">
          {real && diferencia !== 0 && (
            <p className="tabular text-sm">
              Se anota hoy un{' '}
              <span className="font-semibold text-movimiento">
                {diferencia > 0 ? `ingreso de ${formatearMonto(diferencia)}` : `entrega de ${formatearMonto(-diferencia)}`}
              </span>
            </p>
          )}
          <Button type="submit" form="form-ajuste" size="lg" className="w-full">
            Ajustar
          </Button>
        </div>
      }
    >
      <form id="form-ajuste" onSubmit={onSubmit} className="flex flex-col gap-4 pt-1" noValidate>
        <p className="text-sm text-muted-foreground">
          Ahora la app dice <span className="tabular font-semibold">{formatearMonto(banca)}</span>. Escribe
          cuánto hay de verdad y la diferencia queda anotada hoy como movimiento, con el motivo.
        </p>
        <Campo id="banca-real" etiqueta="Banca real" error={errores.real}>
          <InputMonto id="banca-real" valor={real} onValor={setReal} invalido={!!errores.real} />
        </Campo>
        <Campo id="motivo" etiqueta="Motivo" error={errores.motivo}>
          <Input
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej.: conteo del día"
            aria-invalid={!!errores.motivo || undefined}
          />
        </Campo>
      </form>
    </Hoja>
  )
}
