import { useMemo, useState } from 'react'
import { Check, ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { Juego } from '@/data/tipos'
import { FormJuego, type DatosJuego } from './FormJuego'

const MAX_MAS_USADOS = 4

type Props = {
  juegos: readonly Juego[]
  seleccionadoId: string
  porcentajeDefault: number
  onElegir: (juego: Juego) => void
  onCrear: (datos: DatosJuego) => Juego
  onVolver: () => void
  /** Cambia a la vista de "nuevo juego" (para que el padre ponga el titulo y el boton). */
  creando: boolean
  onCreando: (creando: boolean) => void
}

/**
 * Lista de juegos con buscador. Arriba los mas usados; al final
 * "Crear juego nuevo", que pide nombre y % sin salir del formulario.
 */
export function SelectorJuego({
  juegos,
  seleccionadoId,
  porcentajeDefault,
  onElegir,
  onCrear,
  onVolver,
  creando,
  onCreando,
}: Props) {
  const [busqueda, setBusqueda] = useState('')

  const activos = useMemo(() => juegos.filter((j) => j.activo), [juegos])
  const masUsados = useMemo(
    () =>
      [...activos]
        .filter((j) => (j.usos ?? 0) > 0)
        .sort((a, b) => (b.usos ?? 0) - (a.usos ?? 0) || a.orden - b.orden)
        .slice(0, MAX_MAS_USADOS),
    [activos],
  )
  const buscando = busqueda.trim() !== ''

  if (creando) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          className="justify-start self-start px-2 text-muted-foreground"
          onClick={() => onCreando(false)}
        >
          <ChevronLeft /> Volver a la lista
        </Button>
        <FormJuego
          id="form-juego-nuevo"
          juegos={juegos}
          autoFocus
          inicial={{ nombre: busqueda.trim(), porcentaje: String(porcentajeDefault) }}
          onGuardar={(datos) => {
            const juego = onCrear(datos)
            setBusqueda('')
            onCreando(false)
            onElegir(juego)
          }}
        />
      </div>
    )
  }

  const item = (j: Juego, grupo: string) => (
    <CommandItem
      key={`${grupo}-${j.id}`}
      value={`${grupo}-${j.id}`}
      keywords={[j.nombre]}
      onSelect={() => onElegir(j)}
      className={cn(
        'min-h-12 rounded-lg px-3 text-base',
        j.id === seleccionadoId && 'font-medium text-primary',
      )}
    >
      <span className="flex-1 truncate">{j.nombre}</span>
      <span className="tabular text-sm text-muted-foreground">{j.porcentaje}%</span>
      {j.id === seleccionadoId && <Check className="size-5 text-primary" />}
    </CommandItem>
  )

  return (
    // Altura fija: al filtrar, la hoja no se encoge y el buscador no se mueve de lugar.
    <div className="flex min-h-[68dvh] flex-col gap-2 sm:min-h-[420px]">
      <Button
        variant="ghost"
        className="justify-start self-start px-2 text-muted-foreground"
        onClick={onVolver}
      >
        <ChevronLeft /> Volver
      </Button>
      <Command
        className="bg-transparent"
        filter={(valor, buscar, palabras) => {
          const texto = (palabras?.join(' ') ?? valor).toLowerCase()
          return texto.includes(buscar.trim().toLowerCase()) ? 1 : 0
        }}
      >
        <CommandInput placeholder="Buscar juego" value={busqueda} onValueChange={setBusqueda} />
        <CommandList className="mt-2 max-h-none">
          <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
            No hay juegos con ese nombre
          </CommandEmpty>
          {!buscando && masUsados.length > 0 && (
            <CommandGroup heading="Más usados">{masUsados.map((j) => item(j, 'usado'))}</CommandGroup>
          )}
          <CommandGroup heading={buscando || masUsados.length === 0 ? undefined : 'Todos'}>
            {activos.map((j) => item(j, 'todos'))}
          </CommandGroup>
          <CommandGroup forceMount>
            <CommandItem
              value="crear-juego-nuevo"
              forceMount
              onSelect={() => onCreando(true)}
              className="min-h-12 rounded-lg px-3 text-base font-medium text-primary"
            >
              <Plus className="size-5 text-primary" />
              {buscando ? `Crear juego "${busqueda.trim()}"` : 'Crear juego nuevo'}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
