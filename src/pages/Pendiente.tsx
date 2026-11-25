import type { LucideIcon } from 'lucide-react'

/** Pantalla provisional para las opciones del menu que llegan en fases siguientes. */
export default function Pendiente({ titulo, icono: Icono }: { titulo: string; icono: LucideIcon }) {
  return (
    <section className="flex flex-col items-center gap-3 py-16 text-center">
      <Icono className="size-8 text-muted-foreground" />
      <h2 className="text-xl font-semibold">{titulo}</h2>
      <p className="text-sm text-muted-foreground">Esta pantalla estará lista pronto.</p>
    </section>
  )
}
