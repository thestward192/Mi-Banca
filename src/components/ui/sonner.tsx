import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useOscuro } from '@/lib/apariencia'

const Toaster = ({ ...props }: ToasterProps) => {
  const isDark = useOscuro()

  return (
    <Sonner
      theme={isDark ? 'dark' : 'light'}
      className="toaster group"
      toastOptions={{
        classNames: {
          // Boton "Deshacer" comodo para el pulgar (min. 44 px de alto).
          toast: '!text-base',
          actionButton: '!h-11 !rounded-lg !px-4 !text-base !font-semibold',
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
