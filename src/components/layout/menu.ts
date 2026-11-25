import {
  BarChart3,
  CalendarDays,
  Download,
  Home,
  Lock,
  Palette,
  PiggyBank,
  Settings,
  Ticket,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type ItemMenu = { ruta: string; titulo: string; icono: LucideIcon }
export type SeccionMenu = { titulo?: string; items: ItemMenu[] }

/** Menu lateral (diseno-ui.md, seccion 6). "Cerrar sesion" se agrega aparte. */
export const SECCIONES_MENU: SeccionMenu[] = [
  {
    items: [
      { ruta: '/', titulo: 'Hoy', icono: Home },
      { ruta: '/historial', titulo: 'Historial', icono: CalendarDays },
      { ruta: '/resumen', titulo: 'Resumen', icono: BarChart3 },
    ],
  },
  {
    titulo: 'Dinero',
    items: [
      { ruta: '/banca', titulo: 'Banca', icono: Wallet },
      { ruta: '/ganancia', titulo: 'Ganancia acumulada', icono: PiggyBank },
    ],
  },
  {
    titulo: 'Configuración',
    items: [
      { ruta: '/juegos', titulo: 'Juegos', icono: Ticket },
      { ruta: '/ajustes', titulo: 'Ajustes generales', icono: Settings },
      { ruta: '/apariencia', titulo: 'Apariencia', icono: Palette },
    ],
  },
  {
    titulo: 'Cuenta',
    items: [
      { ruta: '/contrasena', titulo: 'Cambiar contraseña', icono: Lock },
      { ruta: '/exportar', titulo: 'Respaldo / Exportar', icono: Download },
    ],
  },
]

export const TODAS_LAS_RUTAS = SECCIONES_MENU.flatMap((s) => s.items)
