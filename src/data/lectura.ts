import { getDocs, orderBy, query, where } from 'firebase/firestore'
import { colDias, colRegistros } from './refs'
import type { Dia, Registro } from './tipos'

/** Dias entre dos fechas (incluidas) con todas sus lineas. Para exportar. */
export async function leerDiasConRegistros(uid: string, desde: string, hasta: string) {
  const dias = await getDocs(
    query(colDias(uid), where('fecha', '>=', desde), where('fecha', '<=', hasta), orderBy('fecha')),
  )
  return Promise.all(
    dias.docs.map(async (d) => {
      const regs = await getDocs(query(colRegistros(uid, d.id), orderBy('orden')))
      return {
        dia: d.data() as Dia,
        registros: regs.docs.map((r) => ({ ...(r.data() as Omit<Registro, 'id'>), id: r.id }) as Registro),
      }
    }),
  )
}
