import { initializeApp } from 'firebase/app'
import { browserLocalPersistence, initializeAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** true si faltan variables VITE_FIREBASE_* (se muestra un aviso en lugar de fallar). */
export const firebaseSinConfigurar = !firebaseConfig.apiKey || !firebaseConfig.projectId

// Sin claves, Firebase falla al iniciar; con valores de relleno la app abre y el login avisa.
export const app = initializeApp(
  firebaseSinConfigurar
    ? { ...firebaseConfig, apiKey: 'sin-configurar', projectId: 'sin-configurar' }
    : firebaseConfig,
)

/** Sesion guardada en el telefono: no vuelve a pedir datos hasta "Cerrar sesion". */
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
})

/** Firestore con cache offline: funciona con mala senal y sincroniza despues. */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})
