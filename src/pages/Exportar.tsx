import { useState } from 'react'
import { FileSpreadsheet, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Campo } from '@/components/Campo'
import { Opciones } from '@/components/Opciones'
import { useDatos } from '@/data/DatosProvider'
import { leerDiasConRegistros } from '@/data/lectura'
import { useHoy } from '@/hooks/useHoy'
import { aCSV, filasDetalle, filasDias } from '@/lib/csv'
import { esFechaISO, fechaConAnio } from '@/lib/fecha'
import { rangoPeriodo } from '@/lib/periodos'

type Rango = 'semana' | 'mes' | 'todo' | 'elegir'
type Archivo = 'detalle' | 'dias'

const CLAVE_ULTIMO = 'mibanca:ultimoRespaldo'

function leerUltimoRespaldo(): string | null {
  try {
    return localStorage.getItem(CLAVE_ULTIMO)
  } catch {
    return null
  }
}

/**
 * En el telefono abre "Compartir" (guardar en Archivos, Drive, WhatsApp...);
 * en la computadora lo descarga directo.
 */
async function entregarArchivo(nombre: string, texto: string) {
  const archivo = new File([texto], nombre, { type: 'text/csv' })
  const esTelefono = window.matchMedia('(pointer: coarse)').matches
  if (esTelefono && navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: nombre })
      return true
    } catch (err) {
      if ((err as Error).name === 'AbortError') return false
      // Si compartir falla, se descarga.
    }
  }
  const url = URL.createObjectURL(archivo)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}

/** Respaldo de un rango de fechas en CSV para abrir en Excel. */
export default function Exportar() {
  const { uid } = useDatos()
  const hoy = useHoy()
  const [rango, setRango] = useState<Rango>('mes')
  const [desde, setDesde] = useState(rangoPeriodo('mes', hoy).desde)
  const [hasta, setHasta] = useState(hoy)
  const [generando, setGenerando] = useState<Archivo | null>(null)
  const [ultimo, setUltimo] = useState(leerUltimoRespaldo)
  const [error, setError] = useState('')

  function limites(): { desde: string; hasta: string } | null {
    if (rango === 'semana') return { desde: rangoPeriodo('semana', hoy).desde, hasta: hoy }
    if (rango === 'mes') return { desde: rangoPeriodo('mes', hoy).desde, hasta: hoy }
    if (rango === 'todo') return { desde: '2000-01-01', hasta: hoy }
    if (!esFechaISO(desde) || !esFechaISO(hasta) || desde > hasta) return null
    return { desde, hasta }
  }

  async function exportar(tipo: Archivo) {
    const r = limites()
    if (!r) {
      setError('Revisa las fechas: "Desde" tiene que ser antes de "Hasta"')
      return
    }
    setError('')
    setGenerando(tipo)
    try {
      const datos = await leerDiasConRegistros(uid, r.desde, r.hasta)
      if (datos.length === 0) {
        toast('No hay días anotados en esas fechas')
        return
      }
      const filas = tipo === 'detalle' ? filasDetalle(datos) : filasDias(datos.map((d) => d.dia))
      const primero = datos[0].dia.fecha
      const ultimoDia = datos[datos.length - 1].dia.fecha
      const nombre = `mibanca-${tipo === 'detalle' ? 'detalle' : 'dias'}_${primero}_a_${ultimoDia}.csv`
      const entregado = await entregarArchivo(nombre, aCSV(filas))
      if (entregado) {
        try {
          localStorage.setItem(CLAVE_ULTIMO, hoy)
        } catch {
          // sin almacenamiento
        }
        setUltimo(hoy)
        toast.success(`Respaldo listo: ${datos.length} ${datos.length === 1 ? 'día' : 'días'}`)
      }
    } catch (err) {
      console.error(err)
      toast.error('No se pudo preparar el respaldo. Revisa la conexión')
    } finally {
      setGenerando(null)
    }
  }

  return (
    <section className="flex flex-col gap-5 pb-8">
      <div className="flex gap-3 rounded-xl border bg-card p-3 text-sm shadow-[0_1px_2px_rgba(0,0,0,.06)]">
        <ShieldCheck className="size-5 shrink-0 text-ganancia" />
        <p className="text-muted-foreground">
          Conviene guardar un respaldo cada semana.{' '}
          {ultimo ? (
            <>
              Último respaldo en este teléfono:{' '}
              <span className="font-medium text-foreground">{fechaConAnio(ultimo, hoy.slice(0, 4))}</span>
            </>
          ) : (
            'Todavía no se ha hecho ninguno en este teléfono.'
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">Fechas</h2>
        <Opciones<Rango>
          etiqueta="Fechas"
          valor={rango}
          onCambiar={setRango}
          opciones={[
            { valor: 'semana', etiqueta: 'Esta semana' },
            { valor: 'mes', etiqueta: 'Este mes' },
            { valor: 'todo', etiqueta: 'Todo' },
            { valor: 'elegir', etiqueta: 'Elegir' },
          ]}
        />
        {rango === 'elegir' && (
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Campo id="desde" etiqueta="Desde">
              <Input id="desde" type="date" value={desde} max={hoy} onChange={(e) => setDesde(e.target.value)} />
            </Campo>
            <Campo id="hasta" etiqueta="Hasta">
              <Input id="hasta" type="date" value={hasta} max={hoy} onChange={(e) => setHasta(e.target.value)} />
            </Campo>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={() => exportar('detalle')} disabled={generando !== null}>
          {generando === 'detalle' ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
          Todas las jugadas (CSV)
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => exportar('dias')}
          disabled={generando !== null}
        >
          {generando === 'dias' ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
          Totales por día (CSV)
        </Button>
        <p className="text-sm text-muted-foreground">
          Los archivos CSV se abren con Excel o con Hojas de cálculo de Google. En el teléfono se abre
          la opción de compartir para guardarlo en Archivos, Drive o enviarlo por WhatsApp.
        </p>
      </div>
    </section>
  )
}
