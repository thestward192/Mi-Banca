import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { AppLayout } from '@/components/layout/AppLayout'
import { TODAS_LAS_RUTAS } from '@/components/layout/menu'
import { PantallaCarga } from '@/components/PantallaCarga'
import Login from '@/pages/Login'
import Pendiente from '@/pages/Pendiente'

export default function App() {
  const { usuario, cargando } = useAuth()

  if (cargando) return <PantallaCarga />
  if (!usuario) return <Login />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {TODAS_LAS_RUTAS.map(({ ruta, titulo, icono }) => (
            <Route key={ruta} path={ruta} element={<Pendiente titulo={titulo} icono={icono} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
