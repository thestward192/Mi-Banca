import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SECCIONES_MENU } from './menu'

type Props = {
  nombre: string
  onNavegar?: () => void
  onCerrarSesion: () => void
}

export function MenuLateral({ nombre, onNavegar, onCerrarSesion }: Props) {
  return (
    <nav className="flex h-full flex-col overflow-y-auto" aria-label="Menú principal">
      <div className="flex h-14 shrink-0 items-center border-b px-4 pt-[env(safe-area-inset-top)]">
        <span className="truncate text-lg font-semibold">{nombre}</span>
      </div>

      <div className="flex-1 py-2">
        {SECCIONES_MENU.map((seccion, i) => (
          <div key={i} className={cn(i > 0 && 'mt-2 border-t pt-2')}>
            {seccion.titulo && (
              <p className="px-4 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {seccion.titulo}
              </p>
            )}
            <ul>
              {seccion.items.map(({ ruta, titulo, icono: Icono }) => (
                <li key={ruta}>
                  <NavLink
                    to={ruta}
                    end={ruta === '/'}
                    onClick={onNavegar}
                    className={({ isActive }) =>
                      cn(
                        'mx-2 flex min-h-12 items-center gap-3 rounded-lg px-3 text-base transition-colors',
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-foreground hover:bg-accent',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icono
                          className={cn('size-5 shrink-0', !isActive && 'text-muted-foreground')}
                        />
                        <span className="truncate">{titulo}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-2 border-t pt-2">
          <button
            type="button"
            onClick={onCerrarSesion}
            className="mx-2 flex min-h-12 w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-3 text-left text-base hover:bg-accent"
          >
            <LogOut className="size-5 shrink-0 text-muted-foreground" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      <div className="h-[env(safe-area-inset-bottom)] shrink-0" />
    </nav>
  )
}
