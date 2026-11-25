import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { AppLayout } from '@/components/layout/AppLayout'
import { TODAS_LAS_RUTAS } from '@/components/layout/menu'
import { PantallaCarga } from '@/components/PantallaCarga'
import { DatosProvider } from '@/data/DatosProvider'
import Ajustes from '@/pages/Ajustes'
import Apariencia from '@/pages/Apariencia'
import Banca from '@/pages/Banca'
import Contrasena from '@/pages/Contrasena'
import DiaAnterior from '@/pages/DiaAnterior'
import Ganancia from '@/pages/Ganancia'
import Historial from '@/pages/Historial'
import Hoy from '@/pages/Hoy'
import Juegos from '@/pages/Juegos'
import Login from '@/pages/Login'
import Pendiente from '@/pages/Pendiente'
import Resumen from '@/pages/Resumen'

/** Pantallas ya hechas; el resto del menu muestra "Esta pantalla estara lista pronto". */
const HECHAS = [
  '/',
  '/historial',
  '/resumen',
  '/banca',
  '/ganancia',
  '/juegos',
  '/ajustes',
  '/apariencia',
  '/contrasena',
]

export default function App() {
  const { usuario, cargando } = useAuth()

  if (cargando) return <PantallaCarga />
  if (!usuario) return <Login />

  return (
    <DatosProvider key={usuario.uid}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Hoy />} />
            <Route path="dia/:fecha" element={<DiaAnterior />} />
            <Route path="historial" element={<Historial />} />
            <Route path="resumen" element={<Resumen />} />
            <Route path="banca" element={<Banca />} />
            <Route path="ganancia" element={<Ganancia />} />
            <Route path="juegos" element={<Juegos />} />
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="apariencia" element={<Apariencia />} />
            <Route path="contrasena" element={<Contrasena />} />
            {TODAS_LAS_RUTAS.filter(({ ruta }) => !HECHAS.includes(ruta)).map(
              ({ ruta, titulo, icono }) => (
                <Route key={ruta} path={ruta} element={<Pendiente titulo={titulo} icono={icono} />} />
              ),
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DatosProvider>
  )
}
