import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { AppLayout } from '@/components/layout/AppLayout'
import { PantallaCarga } from '@/components/PantallaCarga'
import { DatosProvider } from '@/data/DatosProvider'
import Ajustes from '@/pages/Ajustes'
import Apariencia from '@/pages/Apariencia'
import Banca from '@/pages/Banca'
import Contrasena from '@/pages/Contrasena'
import DiaAnterior from '@/pages/DiaAnterior'
import Exportar from '@/pages/Exportar'
import Ganancia from '@/pages/Ganancia'
import Historial from '@/pages/Historial'
import Hoy from '@/pages/Hoy'
import Juegos from '@/pages/Juegos'
import Login from '@/pages/Login'
import Resumen from '@/pages/Resumen'

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
            <Route path="exportar" element={<Exportar />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DatosProvider>
  )
}
