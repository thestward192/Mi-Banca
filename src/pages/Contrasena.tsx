import { useState, type FormEvent } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Campo } from '@/components/Campo'
import { auth } from '@/lib/firebase'
import { completarContrasena } from '@/lib/credenciales'
import { useEnLinea } from '@/hooks/useEnLinea'

const MINIMO = 4

/**
 * Cambiar contrasena. Igual que al entrar, a lo que ella escribe se le agrega
 * el sufijo interno (VITE_PASS_SUFFIX) antes de enviarlo a Firebase.
 */
export default function Contrasena() {
  const enLinea = useEnLinea()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [errores, setErrores] = useState<{ actual?: string; nueva?: string; repetir?: string }>({})
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const nuevos: typeof errores = {}
    if (!actual) nuevos.actual = 'Escribe tu contraseña de ahora'
    if (nueva.length < MINIMO) nuevos.nueva = `La nueva contraseña debe tener al menos ${MINIMO} caracteres`
    else if (nueva === actual) nuevos.nueva = 'La nueva contraseña es igual a la de ahora'
    if (repetir !== nueva) nuevos.repetir = 'Las dos contraseñas nuevas no son iguales'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return

    const usuario = auth.currentUser
    if (!usuario?.email) return
    setEnviando(true)
    try {
      // Firebase pide confirmar la contrasena actual antes de cambiarla.
      await reauthenticateWithCredential(
        usuario,
        EmailAuthProvider.credential(usuario.email, completarContrasena(actual)),
      )
      await updatePassword(usuario, completarContrasena(nueva))
      setActual('')
      setNueva('')
      setRepetir('')
      toast.success('Contraseña cambiada')
    } catch (err) {
      const codigo = err instanceof FirebaseError ? err.code : ''
      if (codigo === 'auth/invalid-credential' || codigo === 'auth/wrong-password') {
        setErrores({ actual: 'La contraseña de ahora no es correcta' })
      } else if (codigo === 'auth/too-many-requests') {
        setErrores({ actual: 'Demasiados intentos. Espera un momento y vuelve a probar' })
      } else if (codigo === 'auth/network-request-failed') {
        toast.error('Sin conexión. Para cambiar la contraseña hace falta internet')
      } else {
        console.error(err)
        toast.error('No se pudo cambiar la contraseña. Vuelve a probar')
      }
    } finally {
      setEnviando(false)
    }
  }

  const campo = (
    id: string,
    etiqueta: string,
    valor: string,
    setValor: (v: string) => void,
    error: string | undefined,
    autoComplete: string,
  ) => (
    <Campo id={id} etiqueta={etiqueta} error={error}>
      <Input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete={autoComplete}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        aria-invalid={!!error || undefined}
      />
    </Campo>
  )

  return (
    <section className="flex flex-col gap-4 pb-8">
      <div className="flex gap-3 rounded-xl border bg-card p-3 text-sm shadow-[0_1px_2px_rgba(0,0,0,.06)]">
        <ShieldCheck className="size-5 shrink-0 text-ganancia" />
        <p className="text-muted-foreground">
          Usa una contraseña más larga que 1234. Como la sesión queda guardada, casi nunca vas a tener
          que escribirla.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {campo('pass-actual', 'Contraseña de ahora', actual, setActual, errores.actual, 'current-password')}
        {campo('pass-nueva', 'Contraseña nueva', nueva, setNueva, errores.nueva, 'new-password')}
        {campo('pass-repetir', 'Repite la contraseña nueva', repetir, setRepetir, errores.repetir, 'new-password')}

        {!enLinea && (
          <p className="text-sm text-muted-foreground">Para cambiar la contraseña hace falta internet.</p>
        )}

        <Button type="submit" size="lg" className="mt-2" disabled={enviando || !enLinea}>
          {enviando && <Loader2 className="animate-spin" />}
          Cambiar contraseña
        </Button>
      </form>
    </section>
  )
}
