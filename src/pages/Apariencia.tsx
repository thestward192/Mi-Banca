import { Moon, SmartphoneNfc, Sun } from 'lucide-react'
import { Opciones } from '@/components/Opciones'
import { cambiarApariencia, useApariencia, type TamanoLetra, type Tema } from '@/lib/apariencia'
import { formatearMonto } from '@/lib/formato'

/** Claro / Oscuro / Automatico y tamano de letra. Se guarda en este telefono. */
export default function Apariencia() {
  const { tema, letra } = useApariencia()

  return (
    <section className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">Tema</h2>
        <Opciones<Tema>
          etiqueta="Tema"
          valor={tema}
          onCambiar={(v) => cambiarApariencia({ tema: v })}
          opciones={[
            { valor: 'claro', etiqueta: 'Claro', icono: Sun },
            { valor: 'oscuro', etiqueta: 'Oscuro', icono: Moon },
            { valor: 'auto', etiqueta: 'Automático', icono: SmartphoneNfc },
          ]}
        />
        <p className="text-sm text-muted-foreground">
          Automático usa el mismo tema que tiene el teléfono.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">Tamaño de letra</h2>
        <Opciones<TamanoLetra>
          etiqueta="Tamaño de letra"
          valor={letra}
          onCambiar={(v) => cambiarApariencia({ letra: v })}
          opciones={[
            { valor: 'normal', etiqueta: 'Normal' },
            { valor: 'grande', etiqueta: 'Grande' },
            { valor: 'muy-grande', etiqueta: 'Muy grande' },
          ]}
        />
      </div>

      {/* Vista previa */}
      <div className="rounded-xl border bg-card p-4 text-center shadow-[0_1px_2px_rgba(0,0,0,.06)]">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Así se ve</p>
        <p className="tabular mt-1 text-[2.25rem] leading-tight font-bold">{formatearMonto(96188)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ganancia hoy <span className="font-medium text-ganancia">+{formatearMonto(585)}</span>
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Estos cambios se guardan solo en este teléfono.
      </p>
    </section>
  )
}
