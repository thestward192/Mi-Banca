import { useState, type FormEvent } from 'react'
import { Loader2, Ticket } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { firebaseSinConfigurar } from '@/lib/firebase'

export default function Login() {
  const { entrar } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!usuario.trim()) return setError('Escribe tu usuario')
    if (!contrasena) return setError('Escribe tu contraseña')
    setEnviando(true)
    try {
      await entrar(usuario, contrasena)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar')
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Ticket className="size-7" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold">Mi Banca</h1>
          <p className="text-sm text-muted-foreground">Entra con tu usuario y contraseña</p>
        </div>

        {firebaseSinConfigurar && (
          <p className="mb-4 rounded-lg border border-movimiento/40 bg-movimiento/10 p-3 text-sm">
            Falta configurar Firebase. Copia <code>.env.example</code> a <code>.env</code> y
            completa las claves.
          </p>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="usuario">Usuario</Label>
            <Input
              id="usuario"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contrasena">Contraseña</Label>
            <Input
              id="contrasena"
              name="password"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-2 w-full" disabled={enviando}>
            {enviando && <Loader2 className="animate-spin" />}
            Entrar
          </Button>
        </form>
      </div>
    </main>
  )
}
