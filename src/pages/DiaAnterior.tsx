import { Navigate, useParams } from 'react-router-dom'
import { VistaDia } from '@/components/dia/VistaDia'
import { useHoy } from '@/hooks/useHoy'
import { esFechaISO } from '@/lib/fecha'

/** /dia/AAAA-MM-DD: un dia del Historial, igual que Hoy pero con la franja de aviso. */
export default function DiaAnterior() {
  const { fecha } = useParams()
  const hoy = useHoy()
  if (!esFechaISO(fecha) || fecha > hoy) return <Navigate to="/historial" replace />
  if (fecha === hoy) return <Navigate to="/" replace />
  return <VistaDia key={fecha} fecha={fecha} esHoy={false} />
}
