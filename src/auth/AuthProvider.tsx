import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth } from '@/lib/firebase'
import { completarContrasena, usuarioACorreo } from '@/lib/credenciales'

type AuthState = {
  usuario: User | null
  cargando: boolean
  entrar: (usuario: string, contrasena: string) => Promise<void>
  salir: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUsuario(u)
      setCargando(false)
    })
  }, [])

  async function entrar(nombre: string, contrasena: string) {
    try {
      await signInWithEmailAndPassword(
        auth,
        usuarioACorreo(nombre),
        completarContrasena(contrasena),
      )
    } catch (err) {
      throw new Error(mensajeDeError(err))
    }
  }

  async function salir() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, entrar, salir }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

function mensajeDeError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-email':
        return 'Usuario o contraseña incorrectos'
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Espera un momento y vuelve a probar'
      case 'auth/network-request-failed':
        return 'Sin conexión. Revisa el internet y vuelve a probar'
    }
  }
  return 'No se pudo entrar. Vuelve a probar'
}
