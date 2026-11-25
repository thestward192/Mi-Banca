/**
 * Apariencia de este telefono: tema (claro / oscuro / automatico) y tamano
 * de letra. Se guarda en el telefono (localStorage) porque es una preferencia
 * de cada aparato, no de la cuenta.
 *
 * index.html aplica lo mismo antes de cargar la app, para que no parpadee.
 */
import { useSyncExternalStore } from 'react'

export type Tema = 'claro' | 'oscuro' | 'auto'
export type TamanoLetra = 'normal' | 'grande' | 'muy-grande'
export type Apariencia = { tema: Tema; letra: TamanoLetra }

const CLAVE = 'mibanca:apariencia'
const POR_DEFECTO: Apariencia = { tema: 'claro', letra: 'normal' }
const COLOR_BARRA = { claro: '#FAFAF9', oscuro: '#0C0A09' }

let actual: Apariencia = leer()
const oyentes = new Set<() => void>()

function leer(): Apariencia {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
    return { ...POR_DEFECTO, ...(guardada ?? {}) }
  } catch {
    return POR_DEFECTO
  }
}

const sistemaOscuro = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function esOscuro(a: Apariencia = actual): boolean {
  return a.tema === 'oscuro' || (a.tema === 'auto' && sistemaOscuro())
}

/** Aplica el tema y la letra al documento. */
export function aplicarApariencia(a: Apariencia = actual) {
  const raiz = document.documentElement
  const oscuro = esOscuro(a)
  raiz.classList.toggle('dark', oscuro)
  raiz.style.colorScheme = oscuro ? 'dark' : 'light'
  if (a.letra === 'normal') raiz.removeAttribute('data-letra')
  else raiz.setAttribute('data-letra', a.letra)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', oscuro ? COLOR_BARRA.oscuro : COLOR_BARRA.claro)
}

export function cambiarApariencia(cambios: Partial<Apariencia>) {
  actual = { ...actual, ...cambios }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(actual))
  } catch {
    // sin almacenamiento: solo dura hasta cerrar la app
  }
  aplicarApariencia()
  oyentes.forEach((o) => o())
}

// En "Automatico", seguir al telefono si cambia de claro a oscuro.
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (actual.tema === 'auto') {
      aplicarApariencia()
      oyentes.forEach((o) => o())
    }
  })
}

function suscribir(cb: () => void) {
  oyentes.add(cb)
  return () => oyentes.delete(cb)
}

export function useApariencia(): Apariencia {
  return useSyncExternalStore(suscribir, () => actual)
}

/** true si ahora mismo se ve en oscuro (para los avisos). */
export function useOscuro(): boolean {
  const a = useApariencia()
  return esOscuro(a)
}
