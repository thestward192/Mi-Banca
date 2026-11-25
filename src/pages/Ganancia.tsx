import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { limit, orderBy, query } from 'firebase/firestore'
import { HandCoins, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Campo, InputMonto } from '@/components/Campo'
import { Hoja } from '@/components/Hoja'
import { useDatos } from '@/data/DatosProvider'
import {
  editarCobro,
  eliminarCobro,
  fijarGananciaAcumulada,
  registrarCobro,
} from '@/data/operaciones'
import { colCobros } from '@/data/refs'
import type { Cobro } from '@/data/tipos'
import { useColeccion } from '@/data/useFirestore'
import { useHoy } from '@/hooks/useHoy'
import { esFechaISO, fechaConAnio } from '@/lib/fecha'
import { formatearMonto, formatearNumero, parsearMonto } from '@/lib/formato'

/**
 * Ganancia acumulada desde el ultimo cobro ("% 21.749" del cuaderno).
 * Registrar un cobro la baja; no toca la banca.
 */
export default function Ganancia() {
  const { uid, config } = useDatos()
  const hoy = useHoy()
  const consulta = useMemo(() => query(colCobros(uid), orderBy('fecha', 'desc'), limit(60)), [uid])
  const cobros = useColeccion<Cobro>(consulta, `cobros:${uid}`).datos

  const [hojaCobro, setHojaCobro] = useState<{ abierta: boolean; cobro: Cobro | null }>({
    abierta: false,
    cobro: null,
  })
  const [corrigiendo, setCorrigiendo] = useState(false)

  if (!config) return <div className="h-48 animate-pulse rounded-xl bg-muted" aria-busy="true" />

  const acumulado = config.gananciaAcumulada

  return (
    <section className="flex flex-col gap-4 pb-8">
      <div className="rounded-xl border bg-card p-4 text-center shadow-[0_1px_2px_rgba(0,0,0,.06)]">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Ganancia acumulada
        </p>
        <p
          className={
            'tabular mt-1 text-[2.25rem] leading-tight font-bold ' +
            (acumulado < 0 ? 'text-premio' : 'text-ganancia')
          }
        >
          {formatearMonto(acumulado)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Desde el último cobro. No es parte de la banca.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" className="h-auto min-h-14 py-2 whitespace-normal" onClick={() => setHojaCobro({ abierta: true, cobro: null })}>
          <HandCoins /> Registrar cobro de ganancia
        </Button>
        <Button size="lg" className="h-auto min-h-14 py-2 whitespace-normal" variant="outline" onClick={() => setCorrigiendo(true)}>
          <Pencil /> Corregir acumulado
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Cobros anteriores
        </h2>
        {!cobros ? (
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
        ) : cobros.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Todavía no hay cobros registrados
          </p>
        ) : (
          <ul className="overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,.06)]">
            {cobros.map((c) => (
              <li key={c.id} className="border-b last:border-0">
                <button
                  type="button"
                  onClick={() => setHojaCobro({ abierta: true, cobro: c })}
                  className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{fechaConAnio(c.fecha, hoy.slice(0, 4))}</p>
                    {c.nota && <p className="truncate text-sm text-muted-foreground">{c.nota}</p>}
                  </div>
                  <span className="tabular font-semibold">−{formatearNumero(c.monto)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <HojaCobro
        abierta={hojaCobro.abierta}
        onCambiar={(abierta) => setHojaCobro((h) => ({ ...h, abierta }))}
        cobro={hojaCobro.cobro}
        acumulado={acumulado}
        hoy={hoy}
        confirmarBorrar={config.confirmarBorrar ?? true}
        onGuardar={(datos) => {
          if (hojaCobro.cobro) {
            editarCobro(uid, hojaCobro.cobro, datos)
            toast.success('Cobro guardado')
          } else {
            registrarCobro(uid, datos)
            toast.success('Cobro registrado')
          }
          setHojaCobro((h) => ({ ...h, abierta: false }))
        }}
        onEliminar={(cobro) => {
          eliminarCobro(uid, cobro)
          setHojaCobro((h) => ({ ...h, abierta: false }))
          toast('Cobro eliminado', {
            duration: 5000,
            action: {
              label: 'Deshacer',
              onClick: () =>
                registrarCobro(uid, { monto: cobro.monto, fecha: cobro.fecha, nota: cobro.nota }, cobro.id),
            },
          })
        }}
      />

      <HojaCorregir
        abierta={corrigiendo}
        onCambiar={setCorrigiendo}
        acumulado={acumulado}
        onGuardar={(valor) => {
          fijarGananciaAcumulada(uid, valor)
          toast.success('Acumulado corregido')
          setCorrigiendo(false)
        }}
      />
    </section>
  )
}

function HojaCobro({
  abierta,
  onCambiar,
  cobro,
  acumulado,
  hoy,
  confirmarBorrar,
  onGuardar,
  onEliminar,
}: {
  abierta: boolean
  onCambiar: (v: boolean) => void
  cobro: Cobro | null
  acumulado: number
  hoy: string
  confirmarBorrar: boolean
  onGuardar: (datos: { monto: number; fecha: string; nota: string }) => void
  onEliminar: (cobro: Cobro) => void
}) {
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [nota, setNota] = useState('')
  const [errores, setErrores] = useState<{ monto?: string; fecha?: string }>({})
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    if (!abierta) return
    setErrores({})
    setConfirmando(false)
    // Nuevo cobro: se propone todo el acumulado.
    setMonto(formatearNumero(cobro?.monto ?? Math.max(0, acumulado)))
    setFecha(cobro?.fecha ?? hoy)
    setNota(cobro?.nota ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, cobro?.id])

  const montoN = parsearMonto(monto)
  const queda = acumulado + (cobro?.monto ?? 0) - montoN

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const nuevos: typeof errores = {}
    if (montoN <= 0) nuevos.monto = 'Escribe cuánto cobró'
    if (!esFechaISO(fecha) || fecha > hoy) nuevos.fecha = 'Elige una fecha de hoy o antes'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return
    onGuardar({ monto: montoN, fecha, nota: nota.trim() })
  }

  return (
    <Hoja
      abierta={abierta}
      onCambiar={onCambiar}
      titulo={cobro ? 'Editar cobro' : 'Cobro de ganancia'}
      pie={
        <div className="flex flex-col gap-3">
          <p className="tabular">
            Acumulado quedará: <span className="font-bold">{formatearMonto(queda)}</span>
          </p>
          <Button type="submit" form="form-cobro" size="lg" className="w-full">
            Guardar
          </Button>
        </div>
      }
    >
      <form id="form-cobro" onSubmit={onSubmit} className="flex flex-col gap-4 pt-1" noValidate>
        <p className="text-sm text-muted-foreground">
          La ganancia ya está fuera de la banca, así que cobrar no cambia la banca.
        </p>
        <Campo id="monto-cobro" etiqueta="Monto" error={errores.monto}>
          <InputMonto id="monto-cobro" valor={monto} onValor={setMonto} invalido={!!errores.monto} />
        </Campo>
        <Campo id="fecha-cobro" etiqueta="Fecha" error={errores.fecha}>
          <Input
            id="fecha-cobro"
            type="date"
            value={fecha}
            max={hoy}
            onChange={(e) => setFecha(e.target.value)}
            className="max-w-48"
          />
        </Campo>
        <Campo id="nota-cobro" etiqueta="Nota (opcional)">
          <Input id="nota-cobro" value={nota} onChange={(e) => setNota(e.target.value)} />
        </Campo>
        {cobro && (
          <button
            type="button"
            onClick={() => {
              if (confirmarBorrar && !confirmando) setConfirmando(true)
              else onEliminar(cobro)
            }}
            className="flex min-h-11 items-center gap-2 self-start text-sm font-medium text-destructive"
          >
            <Trash2 className="size-4" />
            {confirmando ? 'Toca otra vez para eliminar' : 'Eliminar cobro'}
          </button>
        )}
      </form>
    </Hoja>
  )
}

function HojaCorregir({
  abierta,
  onCambiar,
  acumulado,
  onGuardar,
}: {
  abierta: boolean
  onCambiar: (v: boolean) => void
  acumulado: number
  onGuardar: (valor: number) => void
}) {
  const [valor, setValor] = useState('')
  useEffect(() => {
    if (abierta) setValor(formatearNumero(acumulado))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta])

  return (
    <Hoja
      abierta={abierta}
      onCambiar={onCambiar}
      titulo="Corregir acumulado"
      pie={
        <Button type="submit" form="form-corregir" size="lg" className="w-full">
          Guardar
        </Button>
      }
    >
      <form
        id="form-corregir"
        onSubmit={(e) => {
          e.preventDefault()
          onGuardar(parsearMonto(valor))
        }}
        className="flex flex-col gap-3 pt-1"
      >
        <p className="text-sm text-muted-foreground">
          Pon el acumulado que tienes en el cuaderno (por ejemplo, el "% 21.749"). Desde aquí la app
          sigue sumando la ganancia de cada día.
        </p>
        <Campo id="acumulado" etiqueta="Ganancia acumulada">
          <InputMonto id="acumulado" valor={valor} onValor={setValor} />
        </Campo>
      </form>
    </Hoja>
  )
}
