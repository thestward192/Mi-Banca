import { useCallback, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { CalendarDays, Menu, WifiOff } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useDeslizarDesdeBorde } from '@/hooks/useDeslizarDesdeBorde'
import { useEnLinea } from '@/hooks/useEnLinea'
import { correoANombre } from '@/lib/credenciales'
import { fechaCorta, hoyISO } from '@/lib/fecha'
import { MenuLateral } from './MenuLateral'

export function AppLayout() {
  const { usuario, salir } = useAuth()
  const navigate = useNavigate()
  const enLinea = useEnLinea()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const nombre = correoANombre(usuario?.email)

  const abrirMenu = useCallback(() => setMenuAbierto(true), [])
  useDeslizarDesdeBorde(abrirMenu, !menuAbierto)

  // Cerrar el menu deslizando hacia la izquierda.
  const toqueX = useRef<number | null>(null)

  function pedirCerrarSesion() {
    setMenuAbierto(false)
    setConfirmarSalida(true)
  }

  const menu = (onNavegar?: () => void) => (
    <MenuLateral nombre={nombre} onNavegar={onNavegar} onCerrarSesion={pedirCerrarSesion} />
  )

  return (
    <div className="min-h-dvh lg:pl-[260px]">
      {/* Computadora: menu siempre visible */}
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] border-r bg-card lg:block">
        {menu()}
      </aside>

      {/* Telefono y tableta: menu deslizable */}
      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[85%] max-w-xs gap-0 bg-card p-0 sm:max-w-xs lg:hidden"
          onTouchStart={(e) => {
            toqueX.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            if (toqueX.current !== null && toqueX.current - e.changedTouches[0].clientX > 60) {
              setMenuAbierto(false)
            }
            toqueX.current = null
          }}
        >
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <SheetDescription className="sr-only">Opciones de la app</SheetDescription>
          {menu(() => setMenuAbierto(false))}
        </SheetContent>
      </Sheet>

      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[960px] items-center gap-2 px-2 lg:px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menú"
            onClick={abrirMenu}
          >
            <Menu className="size-6" />
          </Button>
          <h1 className="flex-1 truncate px-1 text-xl font-semibold">{fechaCorta(hoyISO())}</h1>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ir a otro día"
            onClick={() => navigate('/historial')}
          >
            <CalendarDays className="size-6" />
          </Button>
        </div>
        {!enLinea && (
          <div className="flex items-center justify-center gap-2 border-t bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <WifiOff className="size-4" />
            Sin conexión · se guardará al volver
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-[960px] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <Dialog open={confirmarSalida} onOpenChange={setConfirmarSalida}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Cerrar sesión?</DialogTitle>
            <DialogDescription>
              Después tendrás que volver a escribir tu usuario y contraseña.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmarSalida(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setConfirmarSalida(false)
                await salir()
              }}
            >
              Cerrar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
