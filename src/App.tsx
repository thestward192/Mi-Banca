import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { AppLayout } from '@/components/layout/AppLayout'
import { TODAS_LAS_RUTAS } from '@/components/layout/menu'
import { PantallaCarga } from '@/components/PantallaCarga'
import { DatosProvider } from '@/data/DatosProvider'
import Hoy from '@/pages/Hoy'
import Login from '@/pages/Login'
import Pendiente from '@/pages/Pendiente'

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
            {TODAS_LAS_RUTAS.filter(({ ruta }) => ruta !== '/').map(({ ruta, titulo, icono }) => (
              <Route key={ruta} path={ruta} element={<Pendiente titulo={titulo} icono={icono} />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DatosProvider>
  )
}
