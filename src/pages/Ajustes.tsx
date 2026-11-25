import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Campo } from '@/components/Campo'
import { useAuth } from '@/auth/AuthProvider'
import { useDatos } from '@/data/DatosProvider'
import { guardarAjustes } from '@/data/operaciones'
import { correoANombre } from '@/lib/credenciales'
import { parsearPorcentaje, SIMBOLO_MONEDA } from '@/lib/formato'

/** % por defecto, simbolo de moneda, nombre del menu y confirmacion al borrar. */
export default function Ajustes() {
  const { uid, config } = useDatos()
  const { usuario } = useAuth()
  const [porcentaje, setPorcentaje] = useState('')
  const [simbolo, setSimbolo] = useState('')
  const [nombre, setNombre] = useState('')
  const [errores, setErrores] = useState<{ porcentaje?: string }>({})

  useEffect(() => {
    if (!config) return
    setPorcentaje(String(config.porcentajeDefault))
    setSimbolo(config.simboloMoneda ?? SIMBOLO_MONEDA)
    setNombre(config.nombre ?? '')
    // Solo al cargar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config === undefined])

  if (!config) return <div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const pct = parsearPorcentaje(porcentaje)
    if (pct === null) {
      setErrores({ porcentaje: 'Escribe un porcentaje entre 0 y 100' })
      return
    }
    setErrores({})
    guardarAjustes(uid, {
      porcentajeDefault: pct,
      simboloMoneda: simbolo.trim() || SIMBOLO_MONEDA,
      nombre: nombre.trim(),
    })
    toast.success('Ajustes guardados')
  }

  const confirmar = config.confirmarBorrar ?? true

  return (
    <section className="flex flex-col gap-6 pb-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Campo id="pct-default" etiqueta="% de ganancia por defecto" error={errores.porcentaje}>
          <div className="relative max-w-40">
            <Input
              id="pct-default"
              inputMode="decimal"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              className="tabular pr-8"
              aria-invalid={!!errores.porcentaje || undefined}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
              %
            </span>
          </div>
        </Campo>
        <p className="-mt-2 text-sm text-muted-foreground">
          Es el % que se pone al crear un juego nuevo. Cada juego tiene el suyo en Juegos.
        </p>

        <Campo id="simbolo" etiqueta="Símbolo de moneda">
          <Input
            id="simbolo"
            value={simbolo}
            onChange={(e) => setSimbolo(e.target.value)}
            maxLength={4}
            className="max-w-24 text-center text-lg"
          />
        </Campo>

        <Campo id="nombre-menu" etiqueta="Nombre que aparece en el menú">
          <Input
            id="nombre-menu"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={30}
            placeholder={correoANombre(usuario?.email)}
          />
        </Campo>

        <Button type="submit" size="lg" className="mt-2">
          Guardar
        </Button>
      </form>

      <label className="flex min-h-14 items-center gap-4 rounded-xl border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
        <span className="flex-1">
          <span className="block font-medium">Pedir confirmación antes de borrar</span>
          <span className="block text-sm text-muted-foreground">
            Hay que tocar "Eliminar" dos veces. Siempre se puede Deshacer.
          </span>
        </span>
        <Switch
          checked={confirmar}
          onCheckedChange={(v) => {
            guardarAjustes(uid, { confirmarBorrar: v })
            toast.success(v ? 'Se pedirá confirmación al borrar' : 'Ya no se pedirá confirmación al borrar')
          }}
          className="scale-125"
        />
      </label>
    </section>
  )
}
