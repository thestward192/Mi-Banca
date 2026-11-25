import { collection, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const refConfig = (uid: string) => doc(db, 'usuarios', uid, 'config', 'general')
export const colJuegos = (uid: string) => collection(db, 'usuarios', uid, 'juegos')
export const refJuego = (uid: string, id: string) => doc(db, 'usuarios', uid, 'juegos', id)
export const colDias = (uid: string) => collection(db, 'usuarios', uid, 'dias')
export const refDia = (uid: string, fecha: string) => doc(db, 'usuarios', uid, 'dias', fecha)
export const colRegistros = (uid: string, fecha: string) =>
  collection(db, 'usuarios', uid, 'dias', fecha, 'registros')
export const refRegistro = (uid: string, fecha: string, id: string) =>
  doc(db, 'usuarios', uid, 'dias', fecha, 'registros', id)

export const colCobros = (uid: string) => collection(db, 'usuarios', uid, 'cobrosGanancia')
export const refCobro = (uid: string, id: string) => doc(db, 'usuarios', uid, 'cobrosGanancia', id)

/** Id nuevo para un registro, generado en el telefono (funciona sin conexion). */
export const nuevoIdRegistro = (uid: string, fecha: string) => doc(colRegistros(uid, fecha)).id
