/** Esqueleto gris con forma de tarjetas (sin circulo girando). */
export function PantallaCarga() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[960px] flex-col gap-3 px-4 pt-20" aria-busy="true">
      <span className="sr-only">Cargando</span>
      <div className="mx-auto h-10 w-40 animate-pulse rounded-lg bg-muted" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  )
}
