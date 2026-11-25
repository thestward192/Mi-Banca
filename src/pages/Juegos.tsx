import { useEffect, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Hoja } from '@/components/Hoja'
import { FormJuego } from '@/components/juegos/FormJuego'
import { useDatos } from '@/data/DatosProvider'
import { actualizarJuego, crearJuego, reordenarJuegos } from '@/data/operaciones'
import type { Juego } from '@/data/tipos'
import { cn } from '@/lib/utils'

export default function Juegos() {
  const { uid, config, juegos } = useDatos()
  const [lista, setLista] = useState<Juego[]>([])
  const [hoja, setHoja] = useState<{ abierta: boolean; juego: Juego | null }>({
    abierta: false,
    juego: null,
  })

  // La lista local sigue a Firestore, pero permite reordenar al instante.
  useEffect(() => {
    if (juegos) setLista(juegos)
  }, [juegos])

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!juegos || !config) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const desde = lista.findIndex((j) => j.id === active.id)
    const hasta = lista.findIndex((j) => j.id === over.id)
    const nueva = arrayMove(lista, desde, hasta)
    setLista(nueva)
    reordenarJuegos(uid, nueva)
  }

  function cambiarActivo(j: Juego, activo: boolean) {
    setLista((l) => l.map((x) => (x.id === j.id ? { ...x, activo } : x)))
    actualizarJuego(uid, j.id, { activo })
    toast.success(activo ? `${j.nombre} activado` : `${j.nombre} desactivado: ya no sale al anotar`)
  }

  const editando = hoja.juego

  return (
    <section className="flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-end gap-3">
        <h2 className="sr-only">Juegos</h2>
        <Button onClick={() => setHoja({ abierta: true, juego: null })}>
          <Plus /> Agregar
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Toca un juego para cambiar el nombre o el %. Arrastra desde{' '}
        <GripVertical className="inline size-4 align-text-bottom" aria-label="el ícono de arrastrar" /> para
        ordenarlos. Los desactivados no salen al anotar.
      </p>

      <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
        <SortableContext items={lista.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {lista.map((j) => (
              <FilaJuego
                key={j.id}
                juego={j}
                onEditar={() => setHoja({ abierta: true, juego: j })}
                onActivo={(v) => cambiarActivo(j, v)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <Hoja
        abierta={hoja.abierta}
        onCambiar={(abierta) => setHoja((h) => ({ ...h, abierta }))}
        titulo={editando ? 'Editar juego' : 'Nuevo juego'}
        pie={
          <Button type="submit" form="form-juego" size="lg" className="w-full">
            Guardar
          </Button>
        }
      >
        <FormJuego
          key={`${editando?.id ?? 'nuevo'}-${hoja.abierta}`}
          id="form-juego"
          juegos={juegos}
          editandoId={editando?.id}
          inicial={{
            nombre: editando?.nombre ?? '',
            porcentaje: String(editando?.porcentaje ?? config.porcentajeDefault),
          }}
          onGuardar={(datos) => {
            if (editando) {
              actualizarJuego(uid, editando.id, datos)
              toast.success('Juego guardado')
            } else {
              crearJuego(uid, juegos, datos)
              toast.success('Juego creado')
            }
            setHoja((h) => ({ ...h, abierta: false }))
          }}
        >
          {editando && (
            <p className="text-sm text-muted-foreground">
              Las jugadas ya anotadas conservan el nombre y el % con que se guardaron.
            </p>
          )}
        </FormJuego>
      </Hoja>
    </section>
  )
}

function FilaJuego({
  juego: j,
  onEditar,
  onActivo,
}: {
  juego: Juego
  onEditar: () => void
  onActivo: (activo: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: j.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-1 rounded-xl border bg-card pr-3 shadow-[0_1px_2px_rgba(0,0,0,.06)]',
        isDragging && 'relative z-10 shadow-lg ring-2 ring-primary/40',
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="flex size-12 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
        aria-label={`Mover ${j.nombre}`}
      >
        <GripVertical className="size-5" />
      </button>

      <button
        type="button"
        onClick={onEditar}
        className={cn('flex min-h-12 min-w-0 flex-1 items-center gap-2 text-left', !j.activo && 'opacity-60')}
      >
        <span className="truncate">{j.nombre}</span>
        <span className="tabular text-sm text-muted-foreground">{j.porcentaje}%</span>
        {!j.activo && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            Desactivado
          </span>
        )}
      </button>

      <label className="flex min-h-11 items-center pl-2">
        <span className="sr-only">{j.activo ? `Desactivar ${j.nombre}` : `Activar ${j.nombre}`}</span>
        <Switch checked={j.activo} onCheckedChange={onActivo} className="scale-125" />
      </label>
    </li>
  )
}
