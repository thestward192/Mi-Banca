import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useEsPantallaAncha } from '@/hooks/useMediaQuery'

type Props = {
  abierta: boolean
  onCambiar: (abierta: boolean) => void
  titulo: string
  descripcion?: string
  children: ReactNode
  /** Botones de abajo (Guardar). Quedan siempre visibles aunque el contenido se desplace. */
  pie?: ReactNode
}

/**
 * Formulario como hoja que sube desde abajo en el telefono,
 * y como ventana centrada (max. 480 px) en tableta y computadora.
 */
export function Hoja({ abierta, onCambiar, titulo, descripcion, children, pie }: Props) {
  const ancha = useEsPantallaAncha()

  const encabezado = (Titulo: typeof DialogTitle, Descripcion: typeof DialogDescription) => (
    <div className="flex items-center gap-2">
      <Titulo className="flex-1 text-left text-xl font-semibold">{titulo}</Titulo>
      <Descripcion className="sr-only">{descripcion ?? titulo}</Descripcion>
      <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => onCambiar(false)}>
        <X className="size-6" />
      </Button>
    </div>
  )

  if (ancha) {
    return (
      <Dialog open={abierta} onOpenChange={onCambiar}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[90dvh] flex-col gap-0 rounded-xl p-0 sm:max-w-[480px]"
        >
          <DialogHeader className="px-4 pt-3 pb-1">{encabezado(DialogTitle, DialogDescription)}</DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
          {pie && <div className="border-t p-4">{pie}</div>}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={abierta} onOpenChange={onCambiar} repositionInputs={false}>
      <DrawerContent className="flex max-h-[92dvh] flex-col data-[vaul-drawer-direction=bottom]:max-h-[92dvh] data-[vaul-drawer-direction=bottom]:rounded-t-xl">
        <DrawerHeader className="px-4 pt-2 pb-1">
          {encabezado(DrawerTitle, DrawerDescription)}
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {pie && (
          <div className="border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {pie}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
