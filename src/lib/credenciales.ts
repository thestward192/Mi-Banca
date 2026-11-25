/**
 * Login sin correo (sistema-loteria.md, seccion 3.1).
 *
 * Firebase solo acepta correo + contrasena de 6 caracteres o mas, asi que:
 *  - el usuario se convierte en un correo interno que nunca se muestra:
 *      "Wendy " -> "wendy@mibanca.app"
 *  - la contrasena se completa con un sufijo fijo (VITE_PASS_SUFFIX):
 *      "1234" -> "1234" + sufijo
 */

export const DOMINIO_INTERNO = 'mibanca.app'

export function normalizarUsuario(usuario: string): string {
  return usuario.replace(/\s+/g, '').toLowerCase()
}

export function usuarioACorreo(usuario: string): string {
  return `${normalizarUsuario(usuario)}@${DOMINIO_INTERNO}`
}

export function completarContrasena(
  contrasena: string,
  sufijo: string = import.meta.env.VITE_PASS_SUFFIX ?? '',
): string {
  return `${contrasena}${sufijo}`
}

/** Nombre para mostrar a partir del correo interno: "wendy@mibanca.app" -> "Wendy". */
export function correoANombre(correo: string | null | undefined): string {
  const base = (correo ?? '').split('@')[0]
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : ''
}
