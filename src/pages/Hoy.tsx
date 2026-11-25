import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EncabezadoBanca } from '@/components/dia/EncabezadoBanca'
import { FormJugada } from '@/components/dia/FormJugada'
import { ResumenDia } from '@/components/dia/ResumenDia'
import { TablaRegistros } from '@/components/dia/TablaRegistros'
import { TarjetaJugada } from '@/components/dia/TarjetaJugada'
import { useDatos } from '@/data/DatosProvider'
import { guardarCambiosDia } from '@/data/operaciones'
import { nuevoIdRegistro } from '@/data/refs'
import { useDia } from '@/data/useDia'
import type { DatosJugada, Dia, Jugada, Registro } from '@/data/tipos'
import { useHoy } from '@/hooks/useHoy'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { efectoEnBanca } from '@/lib/calculos'
import { formatearMonto } from '@/lib/formato'

export default function Hoy() {
  const fecha = useHoy()
  const { uid, config, juegos } = useDatos()
  const { dia, registros, cargando } = useDia(fecha, { crearSiFalta: true })
  const escritorio = useMediaQuery('(min-width: 1024px)')

  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState<Jugada | null>(null)
  const [resumenAbierto, setResumenAbierto] = useState(false)
  const [resaltadoId, setResaltadoId] = useState<string | null>(null)

  // Siempre los datos mas recientes (para Deshacer, que corre despues).
  const ultimo = useRef<{ dia?: Dia; registros?: Registro[] }>({})
  ultimo.current = { dia, registros }

  useEffect(() => {
    if (!resaltadoId) return
    const t = window.setTimeout(() => setResaltadoId(null), 1500)
    return () => window.clearTimeout(t)
  }, [resaltadoId])

  if (config === null && !navigator.onLine) return <SinConexionPrimeraVez />
  if (cargando || !dia || !registros || !config || !juegos) return <EsqueletoHoy />

  const esUltimo = !config.ultimoDia || fecha >= config.ultimoDia

  function guardar(despues: Registro[], extra?: { juegoUsado?: string; bancaInicial?: number }) {
    const { dia: d, registros: antes } = ultimo.current
    if (!d || !antes) return null
    return guardarCambiosDia({ uid, dia: d, antes, despues, esUltimo, ...extra })
  }

  function abrirNueva() {
    setEditando(null)
    setFormAbierto(true)
  }

  function abrirEdicion(r: Registro) {
    if (r.tipo !== 'jugada') return // movimientos: Fase 5
    setEditando(r)
    setFormAbierto(true)
  }

  function onGuardar(datos: DatosJugada) {
    const actuales = ultimo.current.registros ?? []
    if (editando) {
      const despues = actuales.map((r) => (r.id === editando.id ? { ...editando, ...datos } : r))
      const r = guardar(despues)
      const esUltimaLinea = actuales[actuales.length - 1]?.id === editando.id
      const cambioBanca =
        efectoEnBanca({ tipo: 'jugada', ...datos }) !== efectoEnBanca(editando)
      toast.success(
        !esUltimaLinea && cambioBanca
          ? 'Jugada guardada · Se actualizaron las bancas siguientes'
          : 'Jugada guardada',
      )
      if (r) setResaltadoId(editando.id)
    } else {
      const id = nuevoIdRegistro(uid, fecha)
      const orden = Math.max(0, ...actuales.map((r) => r.orden)) + 1
      const nueva: Jugada = {
        id,
        orden,
        tipo: 'jugada',
        creadoEn: null,
        ...datos,
        ganancia: 0,
        neto: 0,
        bancaResultante: 0,
      }
      guardar([...actuales, nueva], { juegoUsado: datos.juegoId })
      toast.success('Jugada guardada')
      setResaltadoId(id)
    }
    setFormAbierto(false)
  }

  function onEliminar(jugada: Jugada) {
    const actuales = ultimo.current.registros ?? []
    guardar(actuales.filter((r) => r.id !== jugada.id))
    setFormAbierto(false)
    toast('Jugada eliminada', {
      duration: 5000,
      action: {
        label: 'Deshacer',
        onClick: () => {
          const ahora = ultimo.current.registros ?? []
          if (ahora.some((r) => r.id === jugada.id)) return
          guardar([...ahora, jugada])
          setResaltadoId(jugada.id)
        },
      },
    })
  }

  function onCambiarBancaInicial(monto: number) {
    guardar(ultimo.current.registros ?? [], { bancaInicial: monto })
    toast.success(registros!.length ? 'Se actualizaron las bancas del día' : 'Banca inicial guardada')
  }

  // Banca antes de la linea que se edita (o la banca final, si es nueva).
  const bancaAntes = editando
    ? (registros.find((r) => r.id === editando.id)?.bancaResultante ?? dia.bancaFinal) -
      efectoEnBanca(registros.find((r) => r.id === editando.id) ?? editando)
    : dia.bancaFinal

  return (
    <div className="flex flex-col gap-4 pb-28">
      <div className="sticky top-[var(--alto-barra,3.5rem)] z-20 -mx-4 bg-background px-4 pt-1 pb-2">
        <EncabezadoBanca
          banca={dia.bancaFinal}
          gananciaHoy={dia.totalGanancia}
          gananciaAcumulada={config.gananciaAcumulada}
          onAbrirResumen={() => setResumenAbierto(true)}
        />
      </div>

      {registros.length === 0 ? (
        <section className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center">
          <h2 className="text-lg font-semibold">Aún no hay jugadas hoy</h2>
          <button
            type="button"
            className="tabular min-h-11 text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setResumenAbierto(true)}
          >
            Banca inicial: {formatearMonto(dia.bancaInicial)}
          </button>
          <Button className="mt-2" onClick={abrirNueva}>
            <Plus /> Agregar primera jugada
          </Button>
        </section>
      ) : escritorio ? (
        <TablaRegistros registros={registros} resaltadoId={resaltadoId} onTocar={abrirEdicion} />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {registros.map((r) =>
            r.tipo === 'jugada' ? (
              <li key={r.id}>
                <TarjetaJugada
                  jugada={r}
                  resaltada={resaltadoId === r.id}
                  onTocar={() => abrirEdicion(r)}
                />
              </li>
            ) : null,
          )}
        </ul>
      )}

      {/* Boton fijo abajo, al alcance del pulgar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:left-[260px]">
        <div className="mx-auto flex max-w-[960px] gap-2">
          <Button size="lg" className="flex-1" onClick={abrirNueva}>
            <Plus /> Jugada
          </Button>
        </div>
      </div>

      <FormJugada
        abierta={formAbierto}
        onCambiar={setFormAbierto}
        juegos={juegos}
        porcentajeDefault={config.porcentajeDefault}
        jugada={editando}
        bancaAntes={bancaAntes}
        confirmarBorrar={config.confirmarBorrar ?? true}
        onGuardar={onGuardar}
        onEliminar={onEliminar}
      />

      <ResumenDia
        abierto={resumenAbierto}
        onCambiar={setResumenAbierto}
        dia={dia}
        onCambiarBancaInicial={onCambiarBancaInicial}
      />
    </div>
  )
}

function EsqueletoHoy() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <span className="sr-only">Cargando</span>
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  )
}

function SinConexionPrimeraVez() {
  return (
    <section className="py-16 text-center">
      <h2 className="text-lg font-semibold">Conéctate a internet</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        La primera vez la app necesita internet para preparar tus datos.
      </p>
    </section>
  )
}
