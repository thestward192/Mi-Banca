import { VistaDia } from '@/components/dia/VistaDia'
import { useHoy } from '@/hooks/useHoy'

export default function Hoy() {
  const fecha = useHoy()
  return <VistaDia key={fecha} fecha={fecha} esHoy />
}
