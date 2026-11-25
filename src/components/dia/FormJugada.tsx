import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Campo, InputMonto } from '@/components/Campo'
import { Hoja } from '@/components/Hoja'
import { cn } from '@/lib/utils'
import { SelectorJuego } from '@/components/juegos/SelectorJuego'
import type { DatosJuego } from '@/components/juegos/FormJuego'
import { calcularGanancia, efectoEnBanca } from '@/lib/calculos'
import {
  formatearMientrasEscribe,
  formatearMonto,
  formatearNumero,
  parsearMonto,
  parsearPorcentaje,
} from '@/lib/formato'
import type { DatosJugada, Juego, Jugada } from '@/data/tipos'

const CLAVE_ULTIMO_JUEGO = 'mibanca:ultimoJuego'

function leerUltimoJuego(): string | null {
  try {
    return localStorage.getItem(CLAVE_ULTIMO_JUEGO)
  } catch {
    return null
  }
}
function guardarUltimoJuego(id: string) {
  try {
    localStorage.setItem(CLAVE_ULTIMO_JUEGO, id)
  } catch {
    // sin almacenamiento: no pasa nada
  }
}

type Props = {
  abierta: boolean
  onCambiar: (abierta: boolean) => void
  juegos: Juego[]
  porcentajeDefault: number
  /** Jugada a editar; sin ella es una jugada nueva. */
  jugada: Jugada | null
  /** Banca antes de esta linea (para la vista previa). */
  bancaAntes: number
  confirmarBorrar: boolean
  onGuardar: (datos: DatosJugada) => void
  onEliminar: (jugada: Jugada) => void
  onCrearJuego: (datos: DatosJuego) => Juego
}

type Errores = Partial<Record<'juego' | 'vendido' | 'porcentaje', string>>

export function FormJugada({
  abierta,
  onCambiar,
  juegos,
  porcentajeDefault,
  jugada,
  bancaAntes,
  confirmarBorrar,
  onGuardar,
  onEliminar,
  onCrearJuego,
}: Props) {
  const [vista, setVista] = useState<'form' | 'juegos'>('form')
  const [juegoId, setJuegoId] = useState('')
  const [juegoNombre, setJuegoNombre] = useState('')
  const [numero, setNumero] = useState('')
  const [vendido, setVendido] = useState('')
  const [premio, setPremio] = useState('')
  const [porcentaje, setPorcentaje] = useState('')
  const [nota, setNota] = useState('')
  const [masOpciones, setMasOpciones] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const [confirmando, setConfirmando] = useState(false)
  const [creandoJuego, setCreandoJuego] = useState(false)
  const refNumero = useRef<HTMLInputElement>(null)

  const activos = juegos.filter((j) => j.activo)

  // Llenar el formulario al abrir.
  useEffect(() => {
    if (!abierta) return
    setVista('form')
    setCreandoJuego(false)
    setErrores({})
    setConfirmando(false)
    if (jugada) {
      setJuegoId(jugada.juegoId)
      setJuegoNombre(jugada.juegoNombre)
      setNumero(jugada.numero)
      setVendido(formatearNumero(jugada.vendido))
      setPremio(jugada.premio ? formatearNumero(jugada.premio) : '')
      setPorcentaje(String(jugada.porcentaje))
      setNota(jugada.nota)
      setMasOpciones(jugada.nota !== '' || jugada.porcentaje !== porcentajeDefault)
    } else {
      // El juego va primero y recuerda el ultimo que se uso.
      const ultimo = activos.find((j) => j.id === leerUltimoJuego())
      setJuegoId(ultimo?.id ?? '')
      setJuegoNombre(ultimo?.nombre ?? '')
      setPorcentaje(String(ultimo?.porcentaje ?? porcentajeDefault))
      setNumero('')
      setVendido('')
      setPremio('')
      setNota('')
      setMasOpciones(false)
    }
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, jugada?.id])

  function elegirJuego(j: Juego) {
    setJuegoId(j.id)
    setJuegoNombre(j.nombre)
    setPorcentaje(String(j.porcentaje))
    setErrores((e) => ({ ...e, juego: undefined }))
    setVista('form')
    if (!jugada) setTimeout(() => refNumero.current?.focus(), 50)
  }

  // Vista previa en vivo.
  const vendidoN = parsearMonto(vendido)
  const premioN = parsearMonto(premio)
  const porcentajeN = parsearPorcentaje(porcentaje) ?? porcentajeDefault
  const ganancia = calcularGanancia(vendidoN, porcentajeN)
  const neto = vendidoN - ganancia
  const bancaQueda =
    bancaAntes + efectoEnBanca({ tipo: 'jugada', vendido: vendidoN, porcentaje: porcentajeN, premio: premioN })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const nuevos: Errores = {}
    if (!juegoId) nuevos.juego = 'Elige el juego'
    if (!vendido || vendidoN <= 0) nuevos.vendido = 'Escribe cuánto vendió'
    if (parsearPorcentaje(porcentaje) === null) nuevos.porcentaje = 'Escribe un porcentaje entre 0 y 100'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) {
      if (nuevos.porcentaje) setMasOpciones(true)
      return
    }
    guardarUltimoJuego(juegoId)
    onGuardar({
      numero: numero.trim(),
      juegoId,
      juegoNombre,
      vendido: vendidoN,
      porcentaje: porcentajeN,
      premio: premioN,
      nota: nota.trim(),
    })
  }

  function eliminar() {
    if (!jugada) return
    if (confirmarBorrar && !confirmando) {
      setConfirmando(true)
      return
    }
    onEliminar(jugada)
  }

  const titulo =
    vista === 'juegos'
      ? creandoJuego
        ? 'Nuevo juego'
        : 'Elegir juego'
      : jugada
        ? 'Editar jugada'
        : 'Nueva jugada'

  return (
    <Hoja
      abierta={abierta}
      onCambiar={onCambiar}
      titulo={titulo}
      pie={
        vista === 'form' ? (
          <div className="flex flex-col gap-3">
            <div className="tabular text-sm">
              <p className="text-muted-foreground">
                Ganancia <span className="text-ganancia">{formatearNumero(ganancia)}</span> · Neto{' '}
                {formatearNumero(neto)}
              </p>
              <p className="mt-0.5 text-base">
                Banca quedará: <span className="font-bold">{formatearMonto(bancaQueda)}</span>
              </p>
            </div>
            <Button type="submit" form="form-jugada" size="lg" className="w-full">
              Guardar
            </Button>
          </div>
        ) : creandoJuego ? (
          <Button type="submit" form="form-juego-nuevo" size="lg" className="w-full">
            Guardar juego
          </Button>
        ) : undefined
      }
    >
      {vista === 'juegos' ? (
        <SelectorJuego
          juegos={juegos}
          seleccionadoId={juegoId}
          porcentajeDefault={porcentajeDefault}
          onElegir={elegirJuego}
          onCrear={onCrearJuego}
          onVolver={() => setVista('form')}
          creando={creandoJuego}
          onCreando={setCreandoJuego}
        />
      ) : (
        <form id="form-jugada" onSubmit={onSubmit} className="flex flex-col gap-4 pt-1" noValidate>
          <Campo id="juego" etiqueta="Juego" error={errores.juego}>
            <button
              id="juego"
              type="button"
              onClick={() => setVista('juegos')}
              aria-invalid={!!errores.juego || undefined}
              className={cn(
                'flex h-12 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 text-left text-base',
                errores.juego && 'border-destructive',
                !juegoNombre && 'text-muted-foreground',
              )}
            >
              <span className="truncate">{juegoNombre || 'Elige el juego'}</span>
              <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
            </button>
          </Campo>

          <div className="grid grid-cols-[2fr_3fr] gap-3">
            <Campo id="numero" etiqueta="Número">
              <Input
                ref={refNumero}
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value.toUpperCase())}
                autoComplete="off"
                autoCapitalize="characters"
                enterKeyHint="next"
                maxLength={8}
                className="text-lg font-semibold"
              />
            </Campo>
            <Campo id="vendido" etiqueta="Vendido" error={errores.vendido}>
              <InputMonto id="vendido" valor={vendido} onValor={setVendido} invalido={!!errores.vendido} />
            </Campo>
          </div>

          <Campo
            id="premio"
            etiqueta="Premio"
            accion={
              <Button
                type="button"
                variant={premio === '' || premioN === 0 ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setPremio('')}
              >
                Nadie
              </Button>
            }
          >
            <div className="flex gap-2">
              <InputMonto id="premio" valor={premio} onValor={setPremio} placeholder="Sin premio" />
              <Button
                type="button"
                variant="outline"
                className="h-12 shrink-0 px-4 text-base font-semibold"
                onClick={() => setPremio(formatearMientrasEscribe((premio || '0') + '000'))}
                aria-label="Agregar tres ceros"
              >
                000
              </Button>
            </div>
          </Campo>

          <div>
            <button
              type="button"
              onClick={() => setMasOpciones((v) => !v)}
              className="flex min-h-11 items-center gap-1 text-sm font-medium text-primary"
              aria-expanded={masOpciones}
            >
              {masOpciones ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              Más opciones (%, nota)
            </button>
            {masOpciones && (
              <div className="mt-2 grid grid-cols-[1fr_2fr] gap-3">
                <Campo id="porcentaje" etiqueta="% ganancia" error={errores.porcentaje}>
                  <Input
                    id="porcentaje"
                    inputMode="decimal"
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(e.target.value)}
                    className="tabular"
                    aria-invalid={!!errores.porcentaje || undefined}
                  />
                </Campo>
                <Campo id="nota" etiqueta="Nota">
                  <Input id="nota" value={nota} onChange={(e) => setNota(e.target.value)} />
                </Campo>
              </div>
            )}
          </div>

          {jugada && (
            <button
              type="button"
              onClick={eliminar}
              className="flex min-h-11 items-center gap-2 self-start text-sm font-medium text-destructive"
            >
              <Trash2 className="size-4" />
              {confirmando ? 'Toca otra vez para eliminar' : 'Eliminar jugada'}
            </button>
          )}
        </form>
      )}
    </Hoja>
  )
}
